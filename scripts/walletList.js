// walletList.js
document.addEventListener("DOMContentLoaded", () => {
    const addWalletButton = document.getElementById("add-wallet");
    const walletsContainer = document.getElementById("wallets-container");

    const walletAddresses = []; // Array to hold wallet addresses

    // Add Wallet Address Fields
    addWalletButton.addEventListener("click", () => {
        const walletDiv = document.createElement("div");
        walletDiv.classList.add("wallet-input-container");

        // Create Wallet Address Input
        const walletInput = document.createElement("input");
        walletInput.type = "text";
        walletInput.placeholder = "Enter Wallet Address";
        walletDiv.appendChild(walletInput);

        // Create Delete Button for Wallet Input
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "🗑️";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", () => {
            walletDiv.remove();
            // Remove wallet address from array
            const index = walletAddresses.indexOf(walletInput.value);
            if (index > -1) {
                walletAddresses.splice(index, 1);
            }
        });
        walletDiv.appendChild(deleteButton);

        // Add the entered wallet address to the wallet addresses array
        walletAddresses.push(walletInput.value);

        // Append to Wallets Container
        walletsContainer.appendChild(walletDiv);
    });

    // Make the functions accessible globally
    window.walletAddresses = walletAddresses;
});