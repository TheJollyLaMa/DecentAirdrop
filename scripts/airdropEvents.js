document.addEventListener("DOMContentLoaded", async () => {
    const eventsContainer = document.getElementById("airdrop-events");
    const AIRDROP_CONTRACT_ADDRESS = "0x48Fa7CC60950783820c22392c6F9127cd4eA30f9"; // Your contract address

    // Connect to the blockchain provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // Fetch the contract ABI
    const airdropABI = await fetch("../data/Airdrop.json").then(res => res.json());
    const contract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, airdropABI, provider);

    // Function to format Ethereum addresses
    const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    // Function to format timestamps
    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString() + ", " + date.toLocaleTimeString();
    };

    // Function to append an event to the timeline
    const addEventToTimeline = (subscriber, amount, timestamp, txHash) => {
        const eventElement = document.createElement("div");
        eventElement.classList.add("event-card");

        eventElement.innerHTML = `
            <div class="event-content">
                <p><strong>Subscriber:</strong> ${formatAddress(subscriber)}</p>
                <p><strong>Amount Sent:</strong> ${ethers.utils.formatEther(amount)} ETH</p>
                <p><strong>Timestamp:</strong> ${formatDate(timestamp)}</p>
                <a href="https://optimistic.etherscan.io/tx/${txHash}" target="_blank">View Transaction</a>
            </div>
            <div class="timeline-connector">⸬<img src="./assets/green_arrow_up.png" alt="Arrow" class="timeline-icon">⸬</div>
        `;

        eventsContainer.appendChild(eventElement);
    };

    // Fetch past events
    async function fetchPastEvents() {
        const events = await contract.queryFilter(contract.filters.AirdropSent());
        console.log("Past Events:", events);

        events.forEach(event => {
            const { recipient, amount, timestamp } = event.args;
            addEventToTimeline(recipient, amount, timestamp.toNumber(), event.transactionHash);
        });
    }

    // Listen for new AirdropSent events
    contract.on("AirdropSent", (recipient, amount, timestamp, event) => {
        console.log("New Airdrop Event:", { recipient, amount, timestamp, txHash: event.transactionHash });
        addEventToTimeline(recipient, amount, timestamp.toNumber(), event.transactionHash);
    });

    // Fetch past events on page load
    fetchPastEvents();
});