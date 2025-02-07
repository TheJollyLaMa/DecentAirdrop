import { detectChain } from "./helpers.js";
import { displayAirdropTimeline } from "./airdropEvents.js";
import { displayContractAddress } from "./sendAirdrop.js";


document.addEventListener("DOMContentLoaded", async () => {
    const connectWalletButton = document.getElementById("connect-wallet");
    const walletAddressStart = document.getElementById("wallet-address-start");
    const walletAddressEnd = document.getElementById("wallet-address-end");
    const chainIcon = document.getElementById("chain-icon");

    let connected = false;
    let walletAddress;


    /** 🔹 Function to handle chain switching */
    async function handleChainSwitch() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            console.log("Switched to Chain ID:", chainId);

            await updateChainIcon(chainId);
            await displayContractAddress(chainId);

            // Update native currency and token dropdown
            if (typeof window.updateNativeCurrency === "function") {
                await window.updateNativeCurrency();
            } else {
                console.error("updateNativeCurrency function is not defined");
            }

            if (typeof window.updateTokenDropdown === "function") {
                await window.updateTokenDropdown();
            }
        } catch (error) {
            console.error("Error handling chain switch:", error);
        }
    }

    /** 🔹 Function to update wallet display */
    const updateWalletDisplay = () => {
        if (connected && walletAddress) {
            walletAddressStart.textContent = walletAddress.slice(0, 6);
            walletAddressEnd.textContent = walletAddress.slice(-4);
        }
    };

    /** 🔹 Function to update the chain icon */
    const updateChainIcon = async (chainId) => {
        const chainIcons = {
            1: "./assets/Ethereum.png",
            10: "./assets/Optimism.png",
            137: "./assets/Polygon.png",
            24734: "./assets/MintMe.png"
        };

        const iconSrc = chainIcons[chainId] || "./assets/Eth.gif";
        chainIcon.src = iconSrc;
        console.log("Chain Icon Updated to:", iconSrc);
    };

    /** 🔹 Function to connect wallet */
    const connectWallet = async () => {
        const walletButton = document.getElementById("connect-wallet");

        if (!window.ethereum) {
            alert("MetaMask is not installed!");
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            walletAddress = accounts[0];
            connected = true;

            // Detect current network instead of forcing Optimism
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            console.log("Connected on Chain ID:", chainId);

            // Update UI
            updateWalletDisplay();
            await updateChainIcon(chainId);
            await displayContractAddress(chainId);
            await displayAirdropTimeline();

            // Update wallet button style
            walletButton.classList.add("connected");
            walletButton.classList.remove("disconnected");

            console.log("Wallet Connected:", walletAddress);

            // Update tokens dropdown
            if (typeof window.updateTokenDropdown === "function") {
                window.updateTokenDropdown();
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);

            // Ensure button reflects disconnection
            walletButton.classList.remove("connected");
            walletButton.classList.add("disconnected");
        }
    };

    connectWalletButton.addEventListener("click", connectWallet);

    /** 🔹 Detect the current chain before wallet is connected */
    if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            console.log("Detected Chain ID:", chainId);

            await updateChainIcon(chainId);
            await displayContractAddress(chainId);
        } catch (error) {
            console.error("Error detecting initial chain:", error);
        }

        /** 🔹 Handle chain changes */
        window.ethereum.on("chainChanged", async () => {
            console.log("Chain changed!");
            await handleChainSwitch();
        });
    }

});