import { detectChain } from "./helpers.js";
import { NETWORKS, deployedNetwork } from "./networks.mjs";

const eventsContainer = document.getElementById("airdrop-events");

export async function displayAirdropTimeline() {
    try {
        if (!(window.DecentHead?.getWallet().rawProvider || window.ethereum)) {
            console.error("MetaMask is not installed!");
            eventsContainer.innerHTML = "<p class='neon-text'>MetaMask is required to view the airdrop events.</p>";
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.DecentHead?.getWallet().rawProvider || window.ethereum, 'any');
        const chainId = await detectChain();
        const contractAddress = deployedNetwork(chainId).address;

        // Restore original ABI fetch method
        const response = await fetch(new URL("../data/Airdrop.json", import.meta.url));
        if (!response.ok) throw new Error(`Could not load ABI (${response.status}).`);
        const airdropABI = await response.json();

        const contract = new ethers.Contract(contractAddress, airdropABI, provider);

        const latestBlock = await provider.getBlockNumber();
        console.log("Latest Block:", latestBlock);

        // Set a safe block range (reverting to original range)
        const fromBlock = Math.max(0, latestBlock - 5000);

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

        for (const [index, event] of allEvents.entries()) {
            const blockExplorer = NETWORKS[chainId].explorer;
            const eventType = event.event;
            const campaignName = event.args.campaignName || "Unknown Campaign";
            const recipients = event.args.recipients.length;
            const txHash = event.transactionHash;

            const block = await provider.getBlock(event.blockNumber);
            const eventTimestamp = new Date(block.timestamp * 1000).toLocaleString();
            

            const eventCard = document.createElement("div");
            eventCard.classList.add("event-card");

            for (const text of [`Event: ${eventType}`, `Campaign: ${campaignName}`, `Recipients: ${recipients} addresses`, `Date: ${eventTimestamp}`]) {
                const paragraph = document.createElement("p");
                paragraph.textContent = text;
                eventCard.append(paragraph);
            }
            const link = document.createElement("a");
            link.href = `${blockExplorer}tx/${txHash}`;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "neon-link";
            link.textContent = `View transaction: ${txHash}`;
            eventCard.append(link);

            eventsContainer.appendChild(eventCard);

            // Timeline separator
            if (index < allEvents.length - 1) {
                const separator = document.createElement("div");
                separator.classList.add("timeline-connector");
                separator.innerHTML = `⸬<img src="./assets/umbrella_transparent.png" class="timeline-icon">⸬`;
                eventsContainer.appendChild(separator);
            }
        }

        console.log("Airdrop events displayed successfully.");
    } catch (error) {
        console.error("Error fetching airdrop events:", error);
        eventsContainer.textContent = `Could not load airdrop history: ${error.message}`;
    }
}