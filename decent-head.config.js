window.DECENT_CONFIG = {
  version: '2.0.0', appName: 'DecentAirdrop', subtitle: 'Prepare recipients · verify · send explicitly',
  chain: null, ens: { enabled: false },
  theme: { accent: '#8ce6cc', 'accent-2': '#ffb57b', 'bg-1': '#122931', 'bg-2': '#1d3b42', 'bg-3': '#294851' },
  about: { title: 'About DecentAirdrop', summary: 'Recipient preparation and guarded native/token distribution on explicitly supported networks.',
    sections: [{ title: 'Transaction boundary', body: 'Connecting does not approve or send funds. Re-review recipients, raw units, network and contract after any account or chain change. Unsupported or undeployed networks remain unavailable; no default chain is guessed.' },
      { title: 'Review, approvals and receipts', body: 'Prepare only performs read-only checks, not simulation or a balance reservation. Send requires explicit review, deployed bytecode, balance/account/chain checks, exact token approvals, simulation and a successful receipt. Gas is additional; earlier approvals can remain after a failed or cancelled send. Base and Ethereum have no configured deployment. This is not a bridge or independent contract/token safety review.' },
      { title: 'Separate storage provider', body: 'Selecting Pinata or local Kubo does not upload recipient lists. App backup, replication and rewards are unavailable. Header ethers v6 is module-local and leaves the existing browser ethers v5 untouched.' }] },
  ipfsAdapter: { version: 1, label: 'Airdrop storage gates', capabilities: {},
    getStatus: async () => ({ backup: { state: 'unavailable', detail: 'No validated recipient-list backup adapter. No upload occurred.' } }) },
  links: [{ label: 'Project source', url: 'https://github.com/TheJollyLaMa/DecentAirdrop' }],
};
