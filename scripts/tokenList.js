import { detectChain } from "./helpers.js";
import { amountToUnits } from "./airdrop-plan.mjs";

document.addEventListener("DOMContentLoaded", () => {
    const tokensContainer = document.getElementById("tokens-container");
    const addTokenButton = document.getElementById("add-token");

    const tokenAddressesByNetwork = {
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
        8453: [
            { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", icon: "./assets/Eth.gif", decimals: 6 },
        ]
    };

    const updateTokenDropdown = async (dropdown) => {
        if (!window.DecentHead?.getWallet().snapshot().connected) {
            document.getElementById("status").textContent = "Connect an EVM wallet to load token balances.";
            return;
        }
        if (!dropdown) {
            await Promise.all(Array.from(tokensContainer.querySelectorAll("select")).map(item => updateTokenDropdown(item)));
            return;
        }
    
        console.log("Updating token dropdown...");
        const session = window.DecentHead.getWallet();
        const state = session.snapshot();
        const raw = session.rawProvider;
        const current = () => session.rawProvider === raw && session.snapshot().connected &&
            session.snapshot().address === state.address && session.snapshot().chainId === state.chainId;
        const selectedNetwork = await detectChain(); // Detect the current chain
        if (!current()) return;
        console.log("Selected Network (Chain ID):", selectedNetwork);
    
        const tokens = tokenAddressesByNetwork[selectedNetwork] || [];
        console.log("Available Tokens for Selected Network:", tokens);
    
        dropdown.innerHTML = "<option value=''>Select a token</option>"; // Clear existing options
    
        // Get user's wallet address
        const provider = new ethers.providers.Web3Provider(window.DecentHead?.getWallet().rawProvider || window.ethereum, 'any');
        const [userAddress] = await provider.listAccounts();
        if (!current()) return;
    
        for (const token of tokens) {
            let balance = "balance unavailable";
            let decimals;
    
            try {
                // ERC-20 token balance fetching
                const tokenContract = new ethers.Contract(token.address, [
                    "function balanceOf(address owner) view returns (uint256)",
                    "function decimals() view returns (uint8)"
                ], provider);
    
                decimals = await tokenContract.decimals();
                if (userAddress) {
                    const rawBalance = await tokenContract.balanceOf(userAddress);
                    balance = ethers.utils.formatUnits(rawBalance, decimals);
                } else {
                    balance = "connect wallet for balance";
                }
            } catch (error) {
                console.warn(`Could not fetch balance for ${token.symbol}`, error);
            }
            if (!current()) return;
    
            // Add token to dropdown with balance
            const option = document.createElement("option");
            option.value = token.address;
            option.textContent = `${token.symbol} (${balance})`;
            option.dataset.icon = token.icon; // Attach the icon path
            if (decimals !== undefined) option.dataset.decimals = String(decimals);
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
        amountInput.type = "text";
        amountInput.inputMode = "decimal";
        amountInput.placeholder = "Token Amount";
        tokenDiv.appendChild(amountInput);

        // Create Token Dropdown
        const tokenDropdown = document.createElement("select");
        tokenDropdown.classList.add("tokens-dropdown");
        tokenDiv.appendChild(tokenDropdown);

        // Populate the dropdown with tokens for the current network
        updateTokenDropdown(tokenDropdown).catch(error => {
            document.getElementById("status").textContent = `Could not load tokens: ${error.message}`;
        });

        // Attach the event listener to update the icon
        handleTokenSelection(tokenDropdown);

        // Create Delete Button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "🗑️";
        deleteButton.classList.add("delete-button");
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => { tokenDiv.remove(); updateTally(); });
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
        handleTokenSelection(tokensDropdown);
        tokensDropdown.innerHTML = "<option value=''>Connect wallet to load tokens</option>";
    }

    // Add event listener to the "Add Token" button
    addTokenButton.addEventListener("click", addTokenInput);
    tokensContainer.querySelector(".delete-button")?.addEventListener("click", event => {
        event.currentTarget.closest(".token-input-container").remove();
        updateTally();
    });

    // Expose the updateTokenDropdown function globally for initial population
    window.updateTokenDropdown = updateTokenDropdown;

    document.addEventListener("input", (event) => {
        if (
            event.target.closest(".token-input-container") || 
            event.target.id === "native-coin-amount" ||
            event.target.closest(".wallet-input-container")
        ) {
            updateTally();
        }
    });
});

export const updateTally = async () => {
    const tallyList = document.getElementById("tally-list");
    const tallyTotalNative = document.getElementById("tally-total-native");
    const walletCount = BigInt(Array.from(document.querySelectorAll(".wallet-input-container input")).filter(input => input.value.trim()).length);
    tallyList.replaceChildren();
    try {
        const native = amountToUnits(document.getElementById("native-coin-amount").value.trim() || "0", 18) * walletCount;
        tallyTotalNative.textContent = `Native total: ${ethers.utils.formatEther(native.toString())} for ${walletCount} entered recipients (gas additional). Use Prepare for full validation.`;
        for (const container of document.querySelectorAll(".token-input-container")) {
            const option = container.querySelector("select").selectedOptions[0];
            const amount = container.querySelector("input").value.trim();
            if (!amount && !option?.value) continue;
            if (!option?.value || option.dataset.decimals === undefined) throw new Error("Token decimals unavailable; select a token and retry.");
            const decimals = Number(option.dataset.decimals);
            const total = amountToUnits(amount || "0", decimals) * walletCount;
            const item = document.createElement("li");
            item.textContent = `${option.value}: ${ethers.utils.formatUnits(total.toString(), decimals)} (balance checked before sending)`;
            tallyList.append(item);
        }
    } catch (error) {
        tallyList.replaceChildren();
        tallyTotalNative.textContent = `Summary unavailable: ${error.message}`;
    }
};