import { DecentHead } from '../decent-head.js';
import { displayAirdropTimeline } from './airdropEvents.js';
import { displayContractAddress } from './sendAirdrop.js';

document.addEventListener('DOMContentLoaded', () => {
    const session = DecentHead.getWallet();
    const button = document.getElementById('connect-wallet');
    let generation = 0;
    const update = async state => {
        const request = ++generation;
        document.getElementById('wallet-address-start').textContent = state.address?.slice(0, 6) || '';
        document.getElementById('wallet-address-end').textContent = state.address?.slice(-4) || '';
        button.classList.toggle('connected', state.connected);
        button.classList.toggle('disconnected', !state.connected);
        if (!state.connected) {
            document.getElementById('airdrop-events').replaceChildren();
            document.getElementById('chain-icon').hidden = true;
            document.getElementById('contract-address-display').textContent = 'Disconnected. Connect explicitly to inspect a deployment.';
            for (const select of document.querySelectorAll('.token-input-container select')) {
                select.innerHTML = "<option value=''>Connect wallet to load tokens</option>";
            }
            document.getElementById('tally-list').replaceChildren();
            document.getElementById('tally-total-native').textContent = '';
            document.getElementById('status').textContent = 'Disconnected. Connect and review recipients before sending.';
            return;
        }
        const chainId = Number(BigInt(state.chainId));
        const icon = document.getElementById('chain-icon');
        const icons = { 1: 'Ethereum.png', 10: 'Optimism.png', 137: 'Polygon.png', 24734: 'MintMe.png' };
        icon.hidden = !icons[chainId];
        if (icons[chainId]) icon.src = `./assets/${icons[chainId]}`;
        try {
            await displayContractAddress(chainId);
            if (request !== generation) return;
            await displayAirdropTimeline();
            if (request !== generation) return;
            if (typeof window.updateNativeCurrency === 'function') await window.updateNativeCurrency();
            if (request !== generation) return;
            if (typeof window.updateTokenDropdown === 'function') await window.updateTokenDropdown();
        } catch (error) {
            if (request === generation) document.getElementById('status').textContent = `Network refresh unavailable: ${error.message}`;
        }
    };
    DecentHead.on('wallet', state => { void update(state); });
    button.addEventListener('click', async () => {
        try {
            if (session.snapshot().connected) session.forget();
            else await session.connect();
        } catch (error) {
            document.getElementById('status').textContent = `Wallet connection failed: ${error.message}`;
        }
    });
    void update(session.snapshot());
});
