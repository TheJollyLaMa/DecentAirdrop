import { updateTally } from "./tokenList.js";

document.addEventListener("DOMContentLoaded", () => {
    const addWalletButton = document.getElementById("add-wallet");
    const walletsContainer = document.getElementById("wallets-container");

    const walletAddresses = []; // Array to hold wallet addresses

    // Function to add a wallet input field
    const addWalletInput = () => {
        const walletDiv = document.createElement("div");
        walletDiv.classList.add("wallet-input-container");

        // Create Wallet Address Input
        const walletInput = document.createElement("input");
        walletInput.type = "text";
        walletInput.placeholder = "Enter Wallet Address";

        // Add listener for changes to the wallet input
        walletInput.addEventListener("input", () => {
            const index = walletAddresses.indexOf(walletInput.value);
            if (walletInput.value.trim() !== "" && index === -1) {
                walletAddresses.push(walletInput.value); // Add valid wallet address
            } else if (walletInput.value.trim() === "" && index > -1) {
                walletAddresses.splice(index, 1); // Remove empty wallet address
            }
            updateTally(); // Update tally when wallet input changes
        });

        walletDiv.appendChild(walletInput);

        // Create Delete Button for Wallet Input
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "🗑️";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", () => {
            walletDiv.remove();
            const index = walletAddresses.indexOf(walletInput.value);
            if (index > -1) {
                walletAddresses.splice(index, 1); // Remove wallet address
            }
            updateTally(); // Update tally when a wallet is removed
        });

        walletDiv.appendChild(deleteButton);

        // Append to Wallets Container
        walletsContainer.appendChild(walletDiv);

        updateTally(); // Update tally when a new wallet is added
    };

    // Attach event listener to Add Wallet Button
    addWalletButton.addEventListener("click", addWalletInput);

    // Expose walletAddresses globally (optional for debugging)
    window.walletAddresses = walletAddresses;
});