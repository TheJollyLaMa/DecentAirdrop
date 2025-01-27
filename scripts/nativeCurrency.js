// nativeCurrency.js
document.addEventListener("DOMContentLoaded", async () => {
    const nativeCoinAmountInput = document.getElementById("native-coin-amount");
    const nativeCoinSymbol = document.getElementById("native-coin-symbol");

    // Function to detect the current chain and set the native coin symbol
    const detectChain = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = network.chainId;

        let nativeCoin;
        switch (chainId) {
            case 1:  // Ethereum Mainnet
                nativeCoin = "ETH";
                break;
            case 137: // Polygon
                nativeCoin = "MATIC";
                break;
            case 10:  // Optimism
                nativeCoin = "ETH";
                break;
            default:
                nativeCoin = "ETH"; // Default to ETH if unknown
        }

        nativeCoinSymbol.textContent = nativeCoin;
        return nativeCoin;  // Return the native coin for further use
    };

    // Detect the network and set the native coin symbol when the page loads
    await detectChain();

    // Make the function accessible globally
    window.detectChain = detectChain;
});