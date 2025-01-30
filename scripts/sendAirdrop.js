import { detectChain } from "./helpers.js";

const contractAddressDisplay = document.getElementById("contract-address-display");
const statusElement = document.getElementById("status");

// Contract Addresses for Different Networks
const CONTRACT_ADDRESSES = {
    1: "0x??????????????????????????????????????ETH", // Ethereum Mainnet
    10: "0x48Fa7CC60950783820c22392c6F9127cd4eA30f9", // Optimism
    137: "0x64717B442c6ff1F2f71da09e11ABa7946EE4C5FD",  // Polygon
    24734: "0x5436865bF0aC7470d16C14f6B6E6e0F59333A5c9" //MintMe
};

// Block Explorers for Different Networks
const BLOCK_EXPLORERS = {
    1: "https://etherscan.io/",
    10: "https://optimistic.etherscan.io/",
    137: "https://polygonscan.com/",
    24734: "https://www.mintme.com/explorer/"
};

// ✅ **Fix: Ensure getCurrentContractAddress() properly awaits detectChain()**
async function getCurrentContractAddress() {
    const chainId = await detectChain();
    console.log("Detected Chain ID:", chainId); // Debugging output

    return CONTRACT_ADDRESSES[chainId] || null;
}

// ✅ **Fix: Move this function outside event listener so it can be exported**
async function displayContractAddress() {
    const chainId = await detectChain();
    const contractAddress = await getCurrentContractAddress(); // Await properly
    const explorerBaseUrl = BLOCK_EXPLORERS[chainId] || "#";

    if (!contractAddress) {
        contractAddressDisplay.innerHTML = `<p style="color: red;">No contract available for this network.</p>`;
        return;
    }

    const shortAddressStart = contractAddress.slice(0, 6);
    const shortAddressEnd = contractAddress.slice(-4);

    // **Dynamic Icons Based on Chain**
    const chainIcons = {
        1: "./assets/Ethereum.png",
        10: "./assets/Optimism.png",
        137: "./assets/Polygon.png",
        24734: "./assets/MintMe.png"
    };

    const chainIcon = chainIcons[chainId] || "./assets/Eth.gif"; // Fallback icon

    contractAddressDisplay.innerHTML = `
        <div id="contract-address-display">
            <a href="${explorerBaseUrl + "address/" + contractAddress}" target="_blank" class="contract-link">
                <span id="contract-address-start">${shortAddressStart}</span>
                <span class="icons">
                    <img src="./assets/Eth.gif" alt="Chain Icon" class="icon">
                    <img src="${chainIcon}" alt="Chain Icon" class="icon">
                    <img src="./assets/SecretPyramid.png" alt="Pyramid Icon" class="icon">
                    <img src="${chainIcon}" alt="Chain Icon" class="icon">
                    <img src="./assets/Eth.gif" alt="Chain Icon" class="icon">
                </span>
                <span id="contract-address-end">${shortAddressEnd}</span>
            </a>
        </div>
    `;
}

// ✅ **Call this function immediately so UI updates on page load**
displayContractAddress();

document.addEventListener("DOMContentLoaded", () => {
    const sendAirdropButton = document.getElementById("send-airdrop");

    sendAirdropButton.addEventListener("click", async () => {
        console.log("Send Airdrop button clicked");

        try {
            if (!window.ethereum) {
                alert("MetaMask is required to send transactions.");
                return;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const walletAddress = await signer.getAddress();  // 🔹 Ensures walletAddress is defined        
            console.log("Using Wallet Address:", walletAddress);

            const network = await provider.getNetwork();
            const contractAddress = await getCurrentContractAddress();
            if (!contractAddress) {
                alert("No airdrop contract deployed for this network!");
                return;
            }

            // Load ABI
            const repoName = "DecentAirdrop";  // Your GitHub repo name
            const basePath = window.location.origin.includes("github.io") 
                ? `/${repoName}/data/Airdrop.json`
                : "../data/Airdrop.json";
            
            const airdropABI = await fetch(basePath).then((res) => res.json());
            
            const airdropContract = new ethers.Contract(contractAddress, airdropABI, signer);

            console.log("Connected to contract:", contractAddress);

            // Fetch Campaign Name
            const campaignNameInput = document.getElementById("campaign-name");
            const campaignName = campaignNameInput.value.trim();

            if (!campaignName) {
                alert("Please enter a campaign name.");
                return;
            }

            // Fetch Wallet Addresses
            const walletInputs = document.querySelectorAll(".wallet-input-container input");
            const wallets = Array.from(walletInputs).map((input) => input.value.trim()).filter((addr) => addr !== "");

            if (wallets.length === 0) {
                alert("Please add at least one wallet address.");
                return;
            }

            // Get Native Coin Amount
            const nativeCoinInput = document.getElementById("native-coin-amount");
            const nativeAmount = parseFloat(nativeCoinInput.value) || 0;

            // Fetch Token Data
            const tokenContainers = document.querySelectorAll(".token-input-container");
            const tokenAddresses = [];
            const tokenAmounts = [];

            for (const container of tokenContainers) {
                const dropdown = container.querySelector(".tokens-dropdown");
                const selectedToken = dropdown.options[dropdown.selectedIndex];
                const tokenAmount = container.querySelector("input").value;

                if (selectedToken && selectedToken.value && tokenAmount > 0) {
                    const decimals = 18;
                    const formattedAmount = ethers.utils.parseUnits(tokenAmount, decimals);
                    tokenAddresses.push(selectedToken.value);
                    tokenAmounts.push(wallets.map(() => formattedAmount.toString()));
                }
            }

            // Approve Tokens Before Sending Airdrop
            for (let i = 0; i < tokenAddresses.length; i++) {
                const tokenAddress = tokenAddresses[i];
                const tokenContract = new ethers.Contract(tokenAddress, [
                    "function approve(address spender, uint256 amount) public returns (bool)",
                    "function allowance(address owner, address spender) public view returns (uint256)"
                ], signer);

                const allowance = await tokenContract.allowance(walletAddress, contractAddress);
                const requiredAmount = ethers.BigNumber.from(tokenAmounts[i][0]).mul(wallets.length);

                if (allowance.lt(requiredAmount)) {
                    console.log(`Approving ${requiredAmount.toString()} tokens for ${tokenAddress}...`);
                    const approveTx = await tokenContract.approve(contractAddress, requiredAmount);
                    await approveTx.wait();
                    console.log(`Approval successful for token: ${tokenAddress}`);
                }
            }

            const formattedNativeAmount = ethers.utils.parseEther(nativeAmount.toString());
            const totalNativeAmount = formattedNativeAmount.mul(wallets.length);

            const signerBalance = await provider.getBalance(walletAddress);
            if (signerBalance.lt(totalNativeAmount)) {
                alert("Insufficient native coin balance to cover the airdrop!");
                return;
            }

            console.log("Sending Airdrop...");
            const tx = await airdropContract.sendAirdrop(
                wallets,
                tokenAddresses,
                tokenAmounts,
                formattedNativeAmount,
                campaignName,
                { value: totalNativeAmount.toString() }
            );


            const explorerUrl = BLOCK_EXPLORERS[network.chainId] + "tx/" || "#";
            const txHash = tx.hash;
            const shortHashStart = txHash.slice(0, 6);
            const shortHashEnd = txHash.slice(-4);
            
            // **Dynamic Icons for Transaction Display**
            const txIcons = `
                <img src="./assets/Eth.gif" alt="Icon" class="tx_icon">
                <img src="${currentChainIcon}" alt="Icon" class="tx_icon">
                <img src="./assets/SecretPyramid.png" alt="Icon" class="tx_icon">
                <img src="${currentChainIcon}" alt="Icon" class="tx_icon">
                <img src="./assets/Eth.gif" alt="Icon" class="tx_icon">
            `;
            
            statusElement.innerHTML = `<p style="color: cyan;">
                Transaction Sent! Hash: 
                <a href="${explorerUrl + txHash}" target="_blank">
                    <span id="tx-hash-start">${shortHashStart}</span>
                    <span class="icons">${txIcons}</span>
                    <span id="tx-hash-end">${shortHashEnd}</span>
                </a>
            </p>`;

            const receipt = await tx.wait();
            console.log("Transaction confirmed!", receipt);

            statusElement.innerHTML += `<p style="color: lime;">Transaction confirmed successfully!</p>`;
            alert("Airdrop sent successfully!");
        } catch (error) {
            console.error("Airdrop failed:", error);
            statusElement.innerHTML = `<p style="color: red;">Airdrop failed: ${error.message}</p>`;
        }
    });
});

// ✅ **Export `displayContractAddress()` so `app.js` can use it**
export { displayContractAddress };