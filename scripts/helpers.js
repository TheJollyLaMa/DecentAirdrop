// helpers.js
export const detectChain = async () => {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        console.log("Network detected:", network);
        return network.chainId; // Return the chain ID
    } catch (error) {
        console.error("Error detecting chain:", error);
        return null; // Return null if detection fails
    }
};

export const loadAbi = async (filePath) => {
    try {
        const response = await fetch(filePath); // Fetch the JSON file from a relative path
        const abi = await response.json();
        console.log("ABI Loaded:", abi);
        return abi;
    } catch (error) {
        console.error("Failed to load ABI:", error);
        throw new Error("Could not load ABI");
    }
};


export const formatTransactionHash = (txHash, chainId) => {
    const firstPart = txHash.slice(0, 6);
    const lastPart = txHash.slice(-4);
    
    return `
        <span>${firstPart}</span>
        <span class="icons">
            <img src="./assets/Eth.gif" class="icon">
            <img src="./assets/SecretPyramid.png" class="icon">
            <img src="./assets/Eth.gif" class="icon">
            <img src="./assets/SecretPyramid.png" class="icon">
            <img src="./assets/Eth.gif" class="icon">
        </span>
        <span>${lastPart}</span>
    `;
};