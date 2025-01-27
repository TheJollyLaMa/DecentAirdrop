document.addEventListener("DOMContentLoaded", async () => {
    const tokensDropdown = document.getElementById("tokens-dropdown");
    const chainIcon = document.getElementById("chain-icon");
    const connectWalletButton = document.getElementById("connect-wallet");
    const tokensContainer = document.getElementById("tokens-container");
    const walletsContainer = document.getElementById("wallets-container");
    const addTokenButton = document.getElementById("add-token");
    const addWalletButton = document.getElementById("add-wallet");
    const sendAirdropButton = document.getElementById("send-airdrop");
    const status = document.getElementById("status");
  
    const tokens = [];
    const wallets = [];
    let connected = false;
  
    // Placeholder for wallet address
    let walletAddress;
  
    // Helper function to format token addresses
    const formatAddress = (address) => {
      const first6 = address.slice(0, 6);
      const last4 = address.slice(-4);
      return `${first6}...${last4}`;
    };
  
    const updateWalletDisplay = () => {
        const walletAddressStart = document.getElementById("wallet-address-start");
        const walletAddressEnd = document.getElementById("wallet-address-end");
    
        if (connected && walletAddress) {
            // Split the wallet address
            walletAddressStart.textContent = walletAddress.slice(0, 6);
            walletAddressEnd.textContent = walletAddress.slice(-4);
        } else {
            // Default value when not connected
            walletAddressStart.textContent = "0x0000";
            walletAddressEnd.textContent = "0000";
        }
    };
    
    // Update connectWallet function to call updateWalletDisplay
    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("MetaMask is not installed!");
            return;
        }
    
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        walletAddress = accounts[0];
        console.log("Connected Wallet Address:", walletAddress);
        connected = true;
        updateWalletButton();
        updateWalletDisplay();
        await fetchTokens(walletAddress);
    };
  
    // Function to fetch wallet tokens
    const fetchTokens = async (walletAddress) => {
      console.log("Fetching tokens for wallet:", walletAddress);
  
      // Simulate fetching tokens from wallet (replace with actual API logic)
      const tokenList = [
        { address: "0xSHTAddress", symbol: "SHT", icon: "./assets/SHT.png", balance: "100" },
        { address: "0xUSDGLOAddress", symbol: "USDGLO", icon: "./assets/USDGLO.png", balance: "50" },
        { address: "0xETHAddress", symbol: "ETH", icon: "./assets/ETH.gif", balance: "0.5" },
      ];
  
      tokensDropdown.innerHTML = '<option value="">Select a token</option>';
      tokenList.forEach((token) => {
        const option = document.createElement("option");
        option.value = token.address;
        option.innerHTML = `
          <span>${token.symbol} (${formatAddress(token.address)})</span>
          <img src="${token.icon}" alt="${token.symbol}" style="width: 20px; height: 20px; margin-left: 5px;">
        `;
        tokensDropdown.appendChild(option);
      });
  
      console.log("Tokens fetched and populated in the dropdown:", tokenList);
    };
  
    // Update wallet button style based on connection status
    const updateWalletButton = () => {
        if (connected) {
          connectWalletButton.classList.add("connected");
          connectWalletButton.classList.remove("disconnected");
        } else {
          connectWalletButton.classList.add("disconnected");
          connectWalletButton.classList.remove("connected");
        }
      };
  
    // Function to fetch chain and display chain icon
    const detectChain = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId === 10) {
        chainIcon.src = "./assets/Optimism.png";
      } else if (network.chainId === 137) {
        chainIcon.src = "./assets/Polygon.png";
      }
    };
  
    // Attach event listeners
    connectWalletButton.addEventListener("click", connectWallet);
  
    // Initialize
    detectChain();
    updateWalletButton();
  });