export async function displayAirdropTimeline() {
    const eventsContainer = document.getElementById("airdrop-events");
    const AIRDROP_CONTRACT_ADDRESS = "0x48Fa7CC60950783820c22392c6F9127cd4eA30f9"; // Replace with your contract address

    try {
        // Check if Ethereum provider (MetaMask) is available
        if (!window.ethereum) {
            console.error("MetaMask is not installed!");
            eventsContainer.innerHTML = "<p class='neon-text'>MetaMask is required to view the airdrop events.</p>";
            return;
        }

        // Create ethers provider and contract instance
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const airdropABI = await fetch("../data/Airdrop.json").then((res) => res.json());
        const contract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, airdropABI, provider);

        // Get the latest block number
        const latestBlock = await provider.getBlockNumber();
        console.log("Latest Block:", latestBlock);

        // Fetch NativeAirdropSent events
        const nativeAirdropEvents = await contract.queryFilter(
            contract.filters.NativeAirdropSent(),
            latestBlock - 5000, // Adjust range as needed
            "latest"
        );

        // Fetch TokenAirdropSent events
        const tokenAirdropEvents = await contract.queryFilter(
            contract.filters.TokenAirdropSent(),
            latestBlock - 5000, // Adjust range as needed
            "latest"
        );

        const events = [];

        // Process Native Airdrop Events
        for (const event of nativeAirdropEvents) {
            const block = await provider.getBlock(event.blockNumber);
            events.push({
                type: "NativeAirdropSent",
                sender: event.args.sender,
                recipients: event.args.recipients,
                nativeAmount: ethers.utils.formatEther(event.args.amount),
                campaignName: event.args.campaignName,
                timestamp: new Date(block.timestamp * 1000).toLocaleString(),
                transactionHash: event.transactionHash,
            });
        }

        // Process Token Airdrop Events
        for (const event of tokenAirdropEvents) {
            const block = await provider.getBlock(event.blockNumber);
            events.push({
                type: "TokenAirdropSent",
                sender: event.args.sender,
                token: event.args.token,
                recipients: event.args.recipients,
                amounts: event.args.amounts.map((a) => ethers.utils.formatUnits(a, 18)),
                campaignName: event.args.campaignName,
                timestamp: new Date(block.timestamp * 1000).toLocaleString(),
                transactionHash: event.transactionHash,
            });
        }

        // Sort events by timestamp (oldest first)
        events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Display events in the container
        if (events.length === 0) {
            eventsContainer.innerHTML = "<p class='neon-text'>No airdrop history found.</p>";
            return;
        }

        eventsContainer.innerHTML = "<h3 class='neon-text'>Airdrop Event Timeline</h3>";

        events.forEach((entry, index) => {
            const timelineEntry = document.createElement("div");
            timelineEntry.classList.add("event-card");

            // Event Details with Transaction Link
            if (entry.type === "NativeAirdropSent") {
                timelineEntry.innerHTML = `
                    <p><strong>Type:</strong> Native Airdrop</p>
                    <p><strong>Sender:</strong> ${entry.sender}</p>
                    <p><strong>Recipients:</strong> ${entry.recipients.join(", ")}</p>
                    <p><strong>Amount:</strong> ${entry.nativeAmount} ETH</p>
                    <p><strong>Campaign:</strong> ${entry.campaignName}</p>
                    <p><strong>Date:</strong> ${entry.timestamp}</p>
                    <p><a href="https://optimistic.etherscan.io/tx/${entry.transactionHash}" target="_blank" class="neon-link">View Transaction</a></p>
                `;
            } else if (entry.type === "TokenAirdropSent") {
                timelineEntry.innerHTML = `
                    <p><strong>Type:</strong> Token Airdrop</p>
                    <p><strong>Sender:</strong> ${entry.sender}</p>
                    <p><strong>Token:</strong> ${entry.token}</p>
                    <p><strong>Recipients:</strong> ${entry.recipients.join(", ")}</p>
                    <p><strong>Amounts:</strong> ${entry.amounts.join(", ")}</p>
                    <p><strong>Campaign:</strong> ${entry.campaignName}</p>
                    <p><strong>Date:</strong> ${entry.timestamp}</p>
                    <p><a href="https://optimistic.etherscan.io/tx/${entry.transactionHash}" target="_blank" class="neon-link">View Transaction</a></p>
                `;
            }

            eventsContainer.appendChild(timelineEntry);

            // Add vertical stack of logos between events (except after the last event)
            if (index < events.length - 1) {
                const logoStack = document.createElement("div");
                logoStack.classList.add("logo-stack");
                logoStack.innerHTML = `
                    ⸬
                    <img src="./assets/umbrella_transparent.png" class="icon-small">
                    ⸬
                    <img src="./assets/umbrella_transparent.png" class="icon-small">
                    ⸬
                `;
                eventsContainer.appendChild(logoStack);
            }
        });
    } catch (error) {
        console.error("Error fetching airdrop events:", error);
        eventsContainer.innerHTML = `<p class='error-text'>Error fetching airdrop events. Please try again later.</p>`;
    }
}