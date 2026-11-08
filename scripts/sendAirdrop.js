import { detectChain } from "./helpers.js";
import { prepareAirdrop } from "./airdrop-plan.mjs";
import { NETWORKS, deployedNetwork } from "./networks.mjs";

const contractAddressDisplay = document.getElementById("contract-address-display");
const statusElement = document.getElementById("status");
const TOKEN_ABI = [
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)"
];

export async function displayContractAddress() {
    const session = window.DecentHead?.getWallet();
    const raw = session ? session.rawProvider : window.ethereum;
    const chainId = raw ? await detectChain() : null;
    const network = NETWORKS[chainId];
    contractAddressDisplay.replaceChildren();
    if (!network?.address) {
        contractAddressDisplay.textContent = raw
            ? `${network?.name || "This network"}: no configured deployment. Base is not deployed; preparation does not send funds.`
            : "Connect an EVM wallet to inspect the network. No funds are sent by preparing a plan.";
        return;
    }
    const link = document.createElement("a");
    link.href = `${network.explorer}address/${network.address}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "contract-link";
    link.textContent = `${network.name}: ${network.address}`;
    contractAddressDisplay.append(link);
}

function showStatus(message) {
    statusElement.textContent = message;
}

async function prepare(provider) {
    const { chainId } = await provider.getNetwork();
    const network = NETWORKS[chainId];
    if (!network) throw new Error("Unsupported network.");
    const wallets = Array.from(document.querySelectorAll(".wallet-input-container input"))
        .map(input => input.value.trim()).filter(Boolean).map(value => ethers.utils.getAddress(value));
    const tokens = [];
    for (const container of document.querySelectorAll(".token-input-container")) {
        const tokenAddress = container.querySelector("select").value;
        const amount = container.querySelector("input").value.trim();
        if (!tokenAddress && !amount) continue;
        if (!tokenAddress) throw new Error("Select a token for every entered token amount.");
        const token = new ethers.Contract(ethers.utils.getAddress(tokenAddress), TOKEN_ABI, provider);
        const decimals = await token.decimals();
        tokens.push({ address: token.address, amount, decimals });
    }
    const plan = prepareAirdrop({
        campaign: document.getElementById("campaign-name").value,
        wallets,
        nativeAmount: document.getElementById("native-coin-amount").value.trim(),
        tokens
    });
    return { plan, chainId, network };
}

document.addEventListener("DOMContentLoaded", () => {
    const sendButton = document.getElementById("send-airdrop");
    const prepareButton = document.getElementById("prepare-airdrop");
    let busy = false;
    async function run(send) {
        if (busy) return;
        busy = true;
        sendButton.disabled = prepareButton.disabled = true;
        let submittedHash = null;
        try {
            const session = window.DecentHead?.getWallet();
            const raw = session?.rawProvider || window.ethereum;
            if (!raw) throw new Error("An EVM wallet is required to inspect token decimals and the selected chain.");
            const provider = new ethers.providers.Web3Provider(raw, 'any');
            const { plan, chainId, network } = await prepare(provider);
            if (!send) {
                showStatus(`Prepared only - no approvals or transfers sent. ${network.name}; ${plan.wallets.length} recipients; native total ${ethers.utils.formatEther(plan.totalNative)}; token totals (base units): ${plan.approvals.map(item => `${item.address}: ${item.total}`).join(", ") || "none"}. ${network.address ? "Contract execution and gas are not yet simulated." : "No deployment exists on this network; sending is unavailable."}`);
                return;
            }
            deployedNetwork(chainId);
            if (await provider.getCode(network.address) === "0x") throw new Error("No contract bytecode at the configured address.");
            if (session) {
                if (!session.snapshot().connected) throw new Error("Connect using the header wallet button, then review and send again.");
            } else {
                await provider.send("eth_requestAccounts", []);
            }
            const signer = provider.getSigner();
            const account = await signer.getAddress();
            const assertWallet = async () => {
                if (session && (!session.snapshot().connected || session.rawProvider !== raw)) throw new Error("Wallet session disconnected; review again.");
                const currentChain = Number(BigInt(await raw.request({ method: "eth_chainId" })));
                const accounts = await raw.request({ method: "eth_accounts" });
                if (currentChain !== chainId || accounts[0]?.toLowerCase() !== account.toLowerCase()) {
                    throw new Error("Wallet account or network changed. Review and prepare the airdrop again.");
                }
            };
            await assertWallet();
            if ((await provider.getBalance(account)).lt(plan.totalNative)) throw new Error("Insufficient native balance; gas is additional.");
            for (const item of plan.approvals) {
                const token = new ethers.Contract(item.address, TOKEN_ABI, provider);
                if ((await token.balanceOf(account)).lt(item.total)) throw new Error(`Insufficient token balance: ${item.address}`);
            }
            const response = await fetch(new URL("../data/Airdrop.json", import.meta.url));
            if (!response.ok) throw new Error(`Could not load airdrop ABI (${response.status}).`);
            const contract = new ethers.Contract(network.address, await response.json(), signer);
            if (!window.confirm(`Send on ${network.name} to ${plan.wallets.length} recipients? Native total: ${ethers.utils.formatEther(plan.totalNative)}. Token totals (base units): ${plan.approvals.map(item => `${item.address}: ${item.total}`).join(", ") || "none"}. Wallet approvals and gas are additional. Continue?`)) {
                showStatus("Cancelled before approvals or transfers.");
                return;
            }
            for (const item of plan.approvals) {
                await assertWallet();
                const token = new ethers.Contract(item.address, TOKEN_ABI, signer);
                if ((await token.allowance(account, network.address)).lt(item.total)) {
                    showStatus(`Awaiting token approval for ${item.address}. An approval is not an airdrop.`);
                    if (!(await token.allowance(account, network.address)).isZero()) {
                        await assertWallet();
                        await (await token.approve(network.address, 0)).wait();
                        await assertWallet();
                    }
                    await assertWallet();
                    await (await token.approve(network.address, item.total)).wait();
                }
            }
            await assertWallet();
            const args = [plan.wallets, plan.tokenAddresses, plan.tokenAmounts, plan.nativeAmount, plan.campaign, { value: plan.totalNative }];
            await contract.callStatic.sendAirdrop(...args);
            await contract.estimateGas.sendAirdrop(...args);
            await assertWallet();
            const tx = await contract.sendAirdrop(...args);
            submittedHash = tx.hash;
            showStatus(`Transaction submitted (not confirmed): ${network.explorer}tx/${tx.hash}`);
            const receipt = await tx.wait();
            if (receipt.status !== 1) throw new Error("Transaction reverted.");
            showStatus(`Airdrop confirmed: ${network.explorer}tx/${receipt.transactionHash}`);
        } catch (error) {
            console.error("Airdrop preparation or sending failed:", error);
            showStatus(`${submittedHash ? `Transaction ${submittedHash} was submitted; check its receipt before retrying. ` : ""}Airdrop not confirmed: ${error.message}. Earlier token approvals, if any, may remain; review wallet allowances.`);
        } finally {
            busy = false;
            sendButton.disabled = prepareButton.disabled = false;
        }
    }
    prepareButton.addEventListener("click", () => run(false));
    sendButton.addEventListener("click", () => run(true));
    displayContractAddress();
});
