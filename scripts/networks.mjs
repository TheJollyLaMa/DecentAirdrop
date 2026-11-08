export const NETWORKS = Object.freeze({
    1: { name: "Ethereum", address: null, explorer: "https://etherscan.io/", icon: "./assets/Ethereum.png" },
    10: { name: "Optimism", address: "0x48Fa7CC60950783820c22392c6F9127cd4eA30f9", explorer: "https://optimistic.etherscan.io/", icon: "./assets/Optimism.png" },
    137: { name: "Polygon", address: "0x64717B442c6ff1F2f71da09e11ABa7946EE4C5FD", explorer: "https://polygonscan.com/", icon: "./assets/Polygon.png" },
    8453: { name: "Base", address: null, explorer: "https://basescan.org/", icon: "./assets/Eth.gif" },
    24734: { name: "MintMe", address: "0x5436865bF0aC7470d16C14f6B6E6e0F59333A5c9", explorer: "https://www.mintme.com/explorer/", icon: "./assets/MintMe.png" }
});

export function deployedNetwork(chainId) {
    const network = NETWORKS[chainId];
    if (!network?.address) {
        throw new Error(`${network?.name || "This network"} has no configured airdrop deployment. Base requires source verification and an approved deployment first.`);
    }
    return network;
}
