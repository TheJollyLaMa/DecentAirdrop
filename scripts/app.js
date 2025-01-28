import { detectChain } from "./helpers.js";

document.addEventListener("DOMContentLoaded", async () => {
    const connectWalletButton = document.getElementById("connect-wallet");
    const walletAddressStart = document.getElementById("wallet-address-start");
    const walletAddressEnd = document.getElementById("wallet-address-end");
    const chainIcon = document.getElementById("chain-icon");
    const tokensDropdown = document.getElementById("tokens-dropdown");

    let connected = false;
    let walletAddress;


    if (window.ethereum) {
        window.ethereum.on("chainChanged", async () => {
            console.log("Chain changed!");
    
            // Update the chain icon
            await updateChainIcon();
    
            // Update the native currency display
            if (typeof window.updateNativeCurrency === "function") {
                await window.updateNativeCurrency();
            } else {
                console.error("updateNativeCurrency function is not defined");
            }
    
            // Update the token dropdown for the new network
            const tokensDropdown = document.getElementById("tokens-dropdown");
            if (typeof window.updateTokenDropdown === "function") {
                await window.updateTokenDropdown(tokensDropdown);
            }
        });
    }

    // Function to update wallet display
    const updateWalletDisplay = () => {
        if (connected && walletAddress) {
            walletAddressStart.textContent = walletAddress.slice(0, 6);
            walletAddressEnd.textContent = walletAddress.slice(-4);
        }
    };

    // Function to update chain icon
    const updateChainIcon = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
    
        try {
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            console.log("Detected Chain ID:", chainId); // Log detected chain ID
    
            const chainIcons = {
                1: "./assets/Ethereum.png",  // Ethereum Mainnet
                137: "./assets/Polygon.png", // Polygon
                10: "./assets/Optimism.png", // Optimism
            };
    
            const iconSrc = chainIcons[chainId] || "./assets/Unknown.png";
            const chainIcon = document.getElementById("chain-icon");
            chainIcon.src = iconSrc; // Update the chain icon
            console.log("Chain Icon Updated to:", iconSrc);
        } catch (error) {
            console.error("Error updating chain icon:", error);
        }
    };

    const switchToNetwork = async (chainId) => {
        const networkParams = {
            1: {
                chainId: "0x1",
                chainName: "Ethereum Mainnet",
                rpcUrls: ["https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"],
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            },
            10: {
                chainId: "0xa",
                chainName: "Optimism",
                rpcUrls: ["https://mainnet.optimism.io"],
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            },
            137: {
                chainId: "0x89",
                chainName: "Polygon Mainnet",
                rpcUrls: ["https://polygon-rpc.com"],
                nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
            },
        };
    
        const network = networkParams[chainId];
        if (!network) {
            console.error("Unsupported chain ID:", chainId);
            return;
        }
    
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: network.chainId }],
            });
            console.log(`Switched to ${network.chainName}`);
        } catch (error) {
            console.error(`Error switching to ${network.chainName}:`, error);
            if (error.code === 4902) {
                console.log(`Network ${network.chainName} not found. Adding it...`);
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [network],
                    });
                    console.log(`Added and switched to ${network.chainName}`);
                } catch (addError) {
                    console.error(`Failed to add network ${network.chainName}:`, addError);
                }
            }
        }
    };
    
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

            // Switch to Optimism by default (or your target network)
            const targetChainId = 10; // Optimism chain ID
            await switchToNetwork(targetChainId);

            // Update UI
            updateWalletDisplay();
            await updateChainIcon(); // Ensure the chain icon updates here

            // Set button state to "connected"
            walletButton.classList.add("connected");
            walletButton.classList.remove("disconnected");

            console.log("Wallet Connected:", walletAddress);

            // Populate tokens
            const tokensDropdown = document.getElementById("tokens-dropdown");
            if (typeof window.updateTokenDropdown === "function") {
                window.updateTokenDropdown(tokensDropdown);
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);

            // Set button state to "disconnected"
            walletButton.classList.remove("connected");
            walletButton.classList.add("disconnected");
        }
    };


    connectWalletButton.addEventListener("click", connectWallet);
});