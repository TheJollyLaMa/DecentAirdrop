import { detectChain } from "./helpers.js";

document.addEventListener("DOMContentLoaded", async () => {
    const nativeCoinAmountInput = document.getElementById("native-coin-amount");
    const nativeCoinSymbol = document.getElementById("native-coin-symbol");

    // Function to set the native coin symbol and icon
    const updateNativeCurrency = async () => {
        const chainId = await detectChain();

        let nativeCoin = { name: "ETH", icon: "./assets/Eth.gif" }; // Default to ETH
        switch (chainId) {
            case 1:  // Ethereum Mainnet
                nativeCoin = { name: "ETH", icon: "./assets/Eth.gif" };
                break;
            case 137: // Polygon
                nativeCoin = { name: "POL", icon: "./assets/Polygon.png" };
                break;
            case 10:  // Optimism
                nativeCoin = { name: "ETH", icon: "./assets/Eth_on_Optimism.png" };
                break;
            case 24734: // MintMe
                nativeCoin = { name: "MINTME", icon: "./assets/MintMe.png" };
                break;
            default:
                console.log("Unsupported chain ID:", chainId);
                nativeCoin = { name: "ETH", icon: "./assets/Eth.gif" }; // Fallback for unknown chains
        }

        // Update the icon and label in the UI
        nativeCoinSymbol.innerHTML = `
            <img src="${nativeCoin.icon}" alt="${nativeCoin.name}" class="native-coin-icon" />
            ${nativeCoin.name}
        `;
    };

    // Update the native currency display on page load
    await updateNativeCurrency();

    // Expose the function globally if needed elsewhere
    window.updateNativeCurrency = updateNativeCurrency;
});