import { detectChain } from "./helpers.js";

document.addEventListener("DOMContentLoaded", () => {
    const tokensContainer = document.getElementById("tokens-container");
    const addTokenButton = document.getElementById("add-token");

    const tokenAddressesByNetwork = {
        1: [ // Ethereum Mainnet
            { address: "0x1234567890abcdef1234567890abcdef12345678", symbol: "ETH", icon: "./assets/Ethereum.png", decimals: 18 },
        ],
        10: [ // Optimism
            { address: "0xDb83f6d02a9fA73fc1B47A0Cfff33D2dC66aD619", symbol: "SHT", icon: "./assets/SHT.png", decimals: 18 },
            { address: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3", symbol: "USDGLO", icon: "./assets/USDGLO.png", decimals: 18 },
        ],
        137: [ // Polygon
            { address: "0x81cCeF6414D4CDbed9FD6Ea98c2D00105800cd78", symbol: "SHT", icon: "./assets/SHT.png", decimals: 18 },
            { address: "0x4F604735c1cF31399C6E711D5962b2B3E0225AD3", symbol: "USDGLO", icon: "./assets/USDGLO.png", decimals: 18 },
            { address: "0xECd78F43750CB373DA5A9788FD583F10EcB5c00C", symbol: "BOBCAT", icon: "./assets/BobCat.png", decimals: 18 },
            { address: "0xC95e30880d4b2756684Ef2362204fbAc4806095B", symbol: "W8W", icon: "./assets/WithinTheVacuum.png", decimals: 18 },
            { address: "0x3932EDe1518Db273ef593d84D011C0D8c169143D", symbol: "EBT", icon: "./assets/Eclipse.png", decimals: 18 },
            { address: "0x1a74f818F1b42dBFcE449c7Fa93B107C6e4A2433", symbol: "OMMM", icon: "./assets/Ommm.png", decimals: 18 },
        ],
        24734: [ //MintMe}
            { address: "0x1234567890abcdef1234567890abcdef12345678", symbol: "DSH", icon: "./assets/SHT.png", decimals: 18 },
        ]
    };

    const updateTokenDropdown = async (dropdown) => {
        if (!dropdown) {
            console.error("Token dropdown not found");
            return;
        }
    
        console.log("Updating token dropdown...");
        const selectedNetwork = await detectChain(); // Detect the current chain
        console.log("Selected Network (Chain ID):", selectedNetwork);
    
        const tokens = tokenAddressesByNetwork[selectedNetwork] || [];
        console.log("Available Tokens for Selected Network:", tokens);
    
        dropdown.innerHTML = "<option value=''>Select a token</option>"; // Clear existing options
    
        // Get user's wallet address
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
    
        for (const token of tokens) {
            let balance = "0"; // Default balance
    
            try {
                // ERC-20 token balance fetching
                const tokenContract = new ethers.Contract(token.address, [
                    "function balanceOf(address owner) view returns (uint256)",
                    "function decimals() view returns (uint8)"
                ], signer);
    
                const rawBalance = await tokenContract.balanceOf(userAddress);
                const decimals = await tokenContract.decimals();
                balance = ethers.utils.formatUnits(rawBalance, decimals);
            } catch (error) {
                console.warn(`Could not fetch balance for ${token.symbol}`, error);
            }
    
            // Add token to dropdown with balance
            const option = document.createElement("option");
            option.value = token.address;
            option.textContent = `${token.symbol} (${balance})`;
            option.dataset.icon = token.icon; // Attach the icon path
            dropdown.appendChild(option);
        }
    };

    const handleTokenSelection = (dropdown) => {
        dropdown.addEventListener("change", () => {
            const selectedOption = dropdown.options[dropdown.selectedIndex];
            const iconPath = selectedOption.dataset.icon || "./assets/Eth.gif";

            const tokenContainer = dropdown.closest(".token-input-container");
            if (!tokenContainer) {
                console.error("Token container not found.");
                return;
            }

            const tokenIcon = tokenContainer.querySelector(".token-icon"); // Correctly target the token icon
            if (tokenIcon) {
                tokenIcon.src = iconPath;
            } else {
                console.error("Token icon not found in token container.");
            }
            updateTally(); // Update tally when a token is selected

        });
    };

    const addTokenInput = () => {
        const tokenDiv = document.createElement("div");
        tokenDiv.classList.add("token-input-container");

        // Create Token Icon
        const tokenIcon = document.createElement("img");
        tokenIcon.src = "./assets/Eth.gif"; // Default icon
        tokenIcon.alt = "Token Icon";
        tokenIcon.classList.add("token-icon");
        tokenDiv.appendChild(tokenIcon);

        // Create Token Amount Input
        const amountInput = document.createElement("input");
        amountInput.type = "number";
        amountInput.placeholder = "Token Amount";
        tokenDiv.appendChild(amountInput);

        // Create Token Dropdown
        const tokenDropdown = document.createElement("select");
        tokenDropdown.classList.add("tokens-dropdown");
        tokenDiv.appendChild(tokenDropdown);

        // Populate the dropdown with tokens for the current network
        updateTokenDropdown(tokenDropdown);

        // Attach the event listener to update the icon
        handleTokenSelection(tokenDropdown);

        // Create Delete Button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "🗑️";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", () => tokenDiv.remove());
        tokenDiv.appendChild(deleteButton);

        // Append to Tokens Container
        tokensContainer.appendChild(tokenDiv);

        updateTally(); // Update tally when a token is selected

    };

    const tokensDropdown = document.getElementById("tokens-dropdown");
    if (!tokensDropdown) {
        console.error("⚠️ Token dropdown not found! Ensure the element exists in the DOM.");
    } else {
        console.log("✅ Token dropdown detected and loaded.");
        updateTokenDropdown(tokensDropdown);
    }

    // Add event listener to the "Add Token" button
    addTokenButton.addEventListener("click", addTokenInput);

    // Expose the updateTokenDropdown function globally for initial population
    window.updateTokenDropdown = updateTokenDropdown;

    document.addEventListener("input", (event) => {
        if (
            event.target.closest(".token-input-container") || 
            event.target.id === "native-coin-amount"
        ) {
            updateTally();
        }
    });
});

export const updateTally = async () => {
    const tallyList = document.getElementById("tally-list");
    const tallyTotalNative = document.getElementById("tally-total-native");
    const nativeCoinAmount = parseFloat(document.getElementById("native-coin-amount").value) || 0;

    // Get the current number of wallets
    const walletCount = document.querySelectorAll(".wallet-input-container input").length || 1;

    // Clear the existing tally list
    tallyList.innerHTML = "";

    // Get user's native coin balance
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    const userBalanceWei = await provider.getBalance(userAddress);
    const userBalance = parseFloat(ethers.utils.formatEther(userBalanceWei)); // Convert to ETH/MATIC

    // Calculate total native coin amount
    const totalNativeAmount = (nativeCoinAmount * walletCount).toFixed(4);
    const nativeColor = totalNativeAmount > userBalance ? "red" : "lime"; // Red if over budget

    tallyTotalNative.innerHTML = `
        <strong style="color: ${nativeColor};">
            Total Native Coin: ${totalNativeAmount} ${document.getElementById("native-coin-symbol").textContent}
        </strong>
    `;

    // Iterate through token inputs and update the tally
    const tokenContainers = document.querySelectorAll(".token-input-container");

    for (const container of tokenContainers) {
        const dropdown = container.querySelector(".tokens-dropdown");
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        const tokenAmount = parseFloat(container.querySelector("input").value) || 0;

        if (selectedOption && selectedOption.value) {
            const tokenSymbol = selectedOption.textContent.split(" ")[0]; // Extract token symbol
            const tokenAddress = selectedOption.value;

            // Get token balance
            let tokenBalance = 0;
            try {
                const tokenContract = new ethers.Contract(tokenAddress, [
                    "function balanceOf(address owner) view returns (uint256)",
                    "function decimals() view returns (uint8)"
                ], signer);

                const rawBalance = await tokenContract.balanceOf(userAddress);
                const decimals = await tokenContract.decimals();
                tokenBalance = parseFloat(ethers.utils.formatUnits(rawBalance, decimals));
            } catch (error) {
                console.warn(`Could not fetch balance for ${tokenSymbol}`, error);
            }

            // Multiply amount by wallets and round to 4 decimals
            const totalTokenAmount = (tokenAmount * walletCount).toFixed(4);
            const tokenColor = totalTokenAmount > tokenBalance ? "red" : "lime"; // Red if over budget

            // Check if the token is already in the summary
            let existingItem = Array.from(tallyList.children).find(li => li.dataset.token === tokenSymbol);
            if (existingItem) {
                existingItem.innerHTML = `<strong style="color: ${tokenColor};">${tokenSymbol}: ${totalTokenAmount}</strong>`;
            } else {
                const listItem = document.createElement("li");
                listItem.dataset.token = tokenSymbol; // Assign a unique identifier
                listItem.innerHTML = `<strong style="color: ${tokenColor};">${tokenSymbol}: ${totalTokenAmount}</strong>`;
                tallyList.appendChild(listItem);
            }
        }
    }

    console.log(`Wallet count: ${walletCount}`);
    console.log("Tally updated.");
};