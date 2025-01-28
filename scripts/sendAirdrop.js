document.addEventListener("DOMContentLoaded", () => {
    const sendAirdropButton = document.getElementById("send-airdrop");
    const contractAddressDisplay = document.getElementById("contract-address-display");
    const statusElement = document.getElementById("status"); // Status element for updates

    // Your deployed contract address
    const AIRDROP_CONTRACT_ADDRESS = "0x48Fa7CC60950783820c22392c6F9127cd4eA30f9";

    // Chain explorer URLs
    const blockExplorers = {
        1: "https://etherscan.io/tx/",          // Ethereum
        137: "https://polygonscan.com/tx/",     // Polygon
        10: "https://optimistic.etherscan.io/tx/", // Optimism
    };

    // Function to update contract display
    const updateContractDisplay = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = network.chainId;

        // Build contract display with icons
        const first6 = AIRDROP_CONTRACT_ADDRESS.slice(0, 6);
        const last4 = AIRDROP_CONTRACT_ADDRESS.slice(-6);
        const iconsHTML = `
            <img src="./assets/Eth.gif" alt="Chain Icon" class="icon" />
            <img src="./assets/Eth.gif" alt="Chain Icon" class="icon" />
            <img src="./assets/SecretPyramid.png" alt="Chain Icon" class="icon" />
            <img src="./assets/Eth.gif" alt="Chain Icon" class="icon" />
            <img src="./assets/Eth.gif" alt="Chain Icon" class="icon" />
        `;

        // Determine block explorer URL
        const explorerBase = blockExplorers[chainId] || "#";
        const contractURL = explorerBase + AIRDROP_CONTRACT_ADDRESS;

        // Render the display
        contractAddressDisplay.innerHTML = `
            <a href="${contractURL}" target="_blank">
                ${first6} ${iconsHTML} ${last4}
            </a>
        `;
    };

    // Add event listener to update contract display on DOM load
    sendAirdropButton.addEventListener("click", updateContractDisplay);

    // Ensure contract is displayed on page load
    updateContractDisplay();

    if (!sendAirdropButton) {
        console.error("Send Airdrop button not found.");
        return;
    }

    sendAirdropButton.addEventListener("click", async () => {
        console.log("Send Airdrop button clicked");

        try {
            if (!window.ethereum) {
                alert("MetaMask is required to send transactions.");
                return;
            }

            // Use ethers.js to create a provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            const accounts = await provider.send("eth_requestAccounts", []);
            const walletAddress = accounts[0];
            console.log("Wallet Connected:", walletAddress);

            const network = await provider.getNetwork();
            console.log("Connected Network:", network.chainId);

            // **Instantiate the Contract**
            const airdropABI = await fetch("../data/Airdrop.json").then((res) => res.json());
            const airdropContract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, airdropABI, signer);

            // Fetch Wallet Addresses
            const walletInputs = document.querySelectorAll(".wallet-input-container input");
            const wallets = Array.from(walletInputs).map((input) => input.value.trim()).filter((addr) => addr !== "");

            if (wallets.length === 0) {
                alert("Please add at least one wallet address.");
                return;
            }

            // Get Native Coin Amount
            const nativeCoinInput = document.getElementById("native-coin-amount");
            const nativeAmount = parseFloat(nativeCoinInput.value) || 0;

            // Fetch Token Data
            const tokenContainers = document.querySelectorAll(".token-input-container");
            const tokenAddresses = [];
            const tokenAmounts = [];

            for (const container of tokenContainers) {
                const dropdown = container.querySelector(".tokens-dropdown");
                const selectedToken = dropdown.options[dropdown.selectedIndex];
                const tokenAmount = container.querySelector("input").value;

                if (selectedToken && selectedToken.value && tokenAmount > 0) {
                    const decimals = 18; // Default decimals; replace with token-specific decimals if needed
                    const formattedAmount = ethers.utils.parseUnits(tokenAmount, decimals);
                    tokenAddresses.push(selectedToken.value);
                    tokenAmounts.push(wallets.map(() => formattedAmount.toString())); // Use stringified value
                }
            }

            // Parse Native Amount
            const formattedNativeAmount = ethers.utils.parseEther(nativeAmount.toString());

            // Total Native Coin Required
            const totalNativeAmount = formattedNativeAmount.mul(wallets.length);

            // Send Airdrop
            console.log("Sending Airdrop...");
            const tx = await airdropContract.sendAirdrop(
                wallets,
                tokenAddresses,
                tokenAmounts,
                formattedNativeAmount, // Native coin amount per wallet
                { value: totalNativeAmount.toString() } // Total ETH value for native coins
            );

            // Display transaction hash in the status element
            statusElement.innerHTML = `
                <p style="color: cyan;">Transaction Sent! Hash: <a href="${blockExplorers[network.chainId] + tx.hash}" target="_blank">${tx.hash}</a></p>
            `;
            console.log("Transaction Hash:", tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            console.log("Transaction confirmed!", receipt);

            // Update status element on confirmation
            statusElement.innerHTML += `<p style="color: lime;">Transaction confirmed successfully!</p>`;
            alert("Airdrop sent successfully!");
        } catch (error) {
            console.error("Airdrop failed:", error);
            statusElement.innerHTML = `<p style="color: red;">Airdrop failed: ${error.message}</p>`;
        }
    });
});