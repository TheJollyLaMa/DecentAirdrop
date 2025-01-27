document.addEventListener("DOMContentLoaded", () => {
    const tokensContainer = document.getElementById("tokens-container");
    const addTokenButton = document.getElementById("add-token");

    // Token addresses by network
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
        ],
    };

    // Function to update the token dropdown
    const updateTokenDropdown = async (dropdown) => {
        if (!dropdown) {
            console.error("Token dropdown not found");
            return; // Prevent further execution if the dropdown is not available
        }
    
        console.log("Attempting to update token dropdown...");
    

        const selectedNetwork = await detectChain(); // Detect the current chain
        console.log("Selected Network (Chain ID):", selectedNetwork);
        
        const tokens = tokenAddressesByNetwork[selectedNetwork] || [];
        console.log("Available Tokens for Selected Network:", tokens);
        dropdown.innerHTML = "<option value=''>Select a token</option>"; // Clear existing options
    
        if (!window.ethereum) {
            console.error("Ethereum provider not found!");
            return;
        }
    
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        console.log("User's Address:", userAddress); // Log the connected wallet address
    
        for (const token of tokens) {
            console.log(`Fetching balance for token: ${token.symbol}, Address: ${token.address}`);
    
            const tokenContract = new ethers.Contract(token.address, [
                "function balanceOf(address) view returns (uint256)",
                "function decimals() view returns (uint8)"
            ], signer);
    
            try {
                const balance = await tokenContract.balanceOf(userAddress);
                const decimals = await tokenContract.decimals();
                const formattedBalance = ethers.utils.formatUnits(balance, decimals);
                console.log(`Token: ${token.symbol}, Balance: ${formattedBalance}`);
    
                const option = document.createElement("option");
                option.value = token.address;
                option.textContent = `${token.symbol} - ${formattedBalance}`;
                dropdown.appendChild(option);
            } catch (error) {
                console.error(`Error fetching balance for token ${token.symbol}:`, error);
            }
        }
    };
    // Add Token Fields Dynamically
    addTokenButton.addEventListener("click", () => {
        const tokenDiv = document.createElement("div");
        tokenDiv.classList.add("token-input-container");

        // Create Token Dropdown
        const tokenDropdown = document.createElement("select");
        tokenDropdown.classList.add("token-dropdown");
        tokenDiv.appendChild(tokenDropdown);

        // Populate the dropdown with tokens for the current network
        updateTokenDropdown(tokenDropdown);

        // Create Token Amount Input
        const amountInput = document.createElement("input");
        amountInput.type = "text";
        amountInput.placeholder = "Token Amount";
        tokenDiv.appendChild(amountInput);

        // Create Delete Button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "🗑️";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", () => tokenDiv.remove());
        tokenDiv.appendChild(deleteButton);

        // Append to Tokens Container
        tokensContainer.appendChild(tokenDiv);
    });

    // Expose the updateTokenDropdown function globally
    window.updateTokenDropdown = updateTokenDropdown;
});