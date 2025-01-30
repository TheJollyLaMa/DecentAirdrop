import { detectChain, formatTransactionHash } from "./helpers.js";

const eventsContainer = document.getElementById("airdrop-events");

// Contract Addresses per Network
const CONTRACT_ADDRESSES = {
    1: "0x??????????????????????????????????????ETH", // Ethereum Mainnet
    10: "0x48Fa7CC60950783820c22392c6F9127cd4eA30f9", // Optimism
    137: "0x64717B442c6ff1F2f71da09e11ABa7946EE4C5FD",  // Polygon
    24734: "0x5436865bF0aC7470d16C14f6B6E6e0F59333A5c9" //MintMe
};

// Block Explorers per Network
const BLOCK_EXPLORERS = {
    1: "https://etherscan.io/",
    10: "https://optimistic.etherscan.io/",
    137: "https://polygonscan.com/",
    24734: "https://www.mintme.com/explorer/"
};

export async function displayAirdropTimeline() {
    try {
        if (!window.ethereum) {
            console.error("MetaMask is not installed!");
            eventsContainer.innerHTML = "<p class='neon-text'>MetaMask is required to view the airdrop events.</p>";
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const chainId = await detectChain();
        const contractAddress = CONTRACT_ADDRESSES[chainId];

        if (!contractAddress) {
            console.error("No contract available for this chain.");
            return;
        }

        // Restore original ABI fetch method
        const repoName = "DecentAirdrop";
        const basePath = window.location.origin.includes("github.io")
            ? `/${repoName}/data/Airdrop.json`
            : "../data/Airdrop.json";
        const airdropABI = await fetch(basePath).then((res) => res.json());

        const contract = new ethers.Contract(contractAddress, airdropABI, provider);

        const latestBlock = await provider.getBlockNumber();
        console.log("Latest Block:", latestBlock);

        // Set a safe block range (reverting to original range)
        const fromBlock = latestBlock - 5000;

        const nativeAirdropEvents = await contract.queryFilter(
            contract.filters.NativeAirdropSent(),
            fromBlock,
            "latest"
        );

        const tokenAirdropEvents = await contract.queryFilter(
            contract.filters.TokenAirdropSent(),
            fromBlock,
            "latest"
        );

        const allEvents = [...nativeAirdropEvents, ...tokenAirdropEvents];

        if (allEvents.length === 0) {
            eventsContainer.innerHTML = "<p class='neon-text'>No airdrop history found.</p>";
            return;
        }

        // Restore sorting method
        allEvents.sort((a, b) => b.blockNumber - a.blockNumber);

        eventsContainer.innerHTML = "<h3 class='neon-text'>Airdrop Event Timeline</h3>";

        allEvents.forEach(async (event, index) => {
            const blockExplorer = BLOCK_EXPLORERS[chainId] || "#";
            const eventType = event.event;
            const campaignName = event.args.campaignName || "Unknown Campaign";
            const recipients = event.args.recipients.length;
            const txHash = event.transactionHash;
            const formatTransactionHash = formatTransactionHash(txHash);

            const block = await provider.getBlock(event.blockNumber);
            const eventTimestamp = new Date(block.timestamp * 1000).toLocaleString();
            

            const eventCard = document.createElement("div");
            eventCard.classList.add("event-card");

            eventCard.innerHTML = `
                <div class="event-content">
                    <p><strong>Event:</strong> ${eventType}</p>
                    <p><strong>Campaign:</strong> ${campaignName}</p>
                    <p><strong>Recipients:</strong> ${recipients} addresses</p>
                    <p><strong>Date:</strong> ${eventTimestamp}</p>
                    <p><a href="${blockExplorer}tx/${txHash}" target="_blank" class="neon-link">View Transaction: ${formattedTransactionHash}</a></p>
                </div>
            `;

            eventsContainer.appendChild(eventCard);

            // Timeline separator
            if (index < allEvents.length - 1) {
                const separator = document.createElement("div");
                separator.classList.add("timeline-connector");
                separator.innerHTML = `⸬<img src="./assets/umbrella_transparent.png" class="timeline-icon">⸬`;
                eventsContainer.appendChild(separator);
            }
        });

        console.log("Airdrop events displayed successfully.");
    } catch (error) {
        console.error("Error fetching airdrop events:", error);
        eventsContainer.innerHTML = `<p class='error-text'>Error fetching airdrop events. Please try again later.</p>`;
    }
}