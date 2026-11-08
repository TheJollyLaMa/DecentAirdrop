const UINT256_MAX = (1n << 256n) - 1n;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = /^0x0{40}$/i;

function address(value, label) {
    if (typeof value !== "string" || !ADDRESS.test(value) || ZERO_ADDRESS.test(value)) {
        throw new Error(`${label} must be a nonzero EVM address.`);
    }
    return value;
}

function uint256(value, label) {
    if (value > UINT256_MAX) throw new Error(`${label} exceeds uint256.`);
    return value;
}

// Adapted from DecentBusking's amountToUnits: keep decimal input exact, never use floating point for transfers.
export function amountToUnits(value, decimals) {
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
        throw new Error("Token decimals must be an integer from 0 to 255.");
    }
    if (typeof value !== "string" || value.length > 100 || !/^\d+(?:\.\d+)?$/.test(value)) {
        throw new Error("Amounts must be nonnegative decimal strings, without exponent notation.");
    }
    const [whole, fraction = ""] = value.split(".");
    if (fraction.length > decimals) throw new Error(`Amount has more than ${decimals} decimal places.`);
    return uint256(BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0"), "Amount");
}

export function prepareAirdrop({ campaign, wallets, nativeAmount, tokens }) {
    if (typeof campaign !== "string" || !campaign.trim()) throw new Error("Enter a campaign name.");
    if (!Array.isArray(wallets) || wallets.length === 0) throw new Error("Add at least one recipient.");
    const seen = new Set();
    wallets.forEach(wallet => {
        address(wallet, "Recipient");
        const key = wallet.toLowerCase();
        if (seen.has(key)) throw new Error("Duplicate recipients are not allowed; check the recipient list.");
        seen.add(key);
    });
    if (!Array.isArray(tokens)) throw new Error("Tokens must be a list.");
    const tokenAddresses = [];
    const tokenAmounts = [];
    const approvals = [];
    const count = BigInt(wallets.length);
    for (const token of tokens) {
        const tokenAddress = address(token.address, "Token");
        if (tokenAddresses.some(value => value.toLowerCase() === tokenAddress.toLowerCase())) {
            throw new Error("Select each token only once.");
        }
        const amount = amountToUnits(token.amount, token.decimals);
        if (amount === 0n) throw new Error("Each selected token needs a positive amount.");
        tokenAddresses.push(tokenAddress);
        tokenAmounts.push(wallets.map(() => amount.toString()));
        approvals.push({ address: tokenAddress, total: uint256(amount * count, "Token total").toString() });
    }
    const nativeUnits = amountToUnits(nativeAmount || "0", 18);
    if (nativeUnits === 0n && tokens.length === 0) throw new Error("Enter a native amount or select a token with a positive amount.");
    return {
        wallets: [...wallets],
        tokenAddresses,
        tokenAmounts,
        nativeAmount: nativeUnits.toString(),
        totalNative: uint256(nativeUnits * count, "Native total").toString(),
        campaign: campaign.trim(),
        approvals
    };
}
