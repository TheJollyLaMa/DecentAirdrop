import test from "node:test";
import assert from "node:assert/strict";

const account = `0x${"1".repeat(40)}`;
const tokenAddress = `0x${"2".repeat(40)}`;
let sequence = 0;

async function harness(t, options = {}) {
    const calls = [];
    const elements = new Map();
    const element = id => {
        if (!elements.has(id)) elements.set(id, {
            value: "", textContent: "", disabled: false,
            addEventListener(name, handler) { this[name] = handler; },
            replaceChildren() {},
            append() {}
        });
        return elements.get(id);
    };
    const quantity = value => ({
        lt: other => BigInt(value) < BigInt(other),
        isZero: () => BigInt(value) === 0n
    });
    let ready;
    const globals = ["document", "window", "ethers", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
    t.after(() => {
        for (const [key, descriptor] of globals) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else delete globalThis[key];
        }
    });
    t.mock.method(console, "error", () => {});
    const chainId = options.chainId ?? 10;
    let changedAccount = options.changedAccount;
    globalThis.document = {
        getElementById: element,
        createElement: () => element("link"),
        addEventListener(name, handler) { ready = handler; },
        querySelectorAll(selector) {
            if (selector.includes("wallet")) return [{ value: account }];
            return options.token ? [{
                querySelector(selector) {
                    return { value: selector === "select" ? tokenAddress : options.amount ?? "1.234567" };
                }
            }] : [];
        }
    };
    globalThis.window = {
        confirm() { calls.push("confirm"); return options.confirm !== false; },
        ethereum: {
            async request({ method }) {
                calls.push(method);
                if (method === "eth_chainId") return `0x${chainId.toString(16)}`;
                if (method === "eth_accounts") return [changedAccount ? tokenAddress : account];
                throw new Error(`Unexpected wallet request: ${method}`);
            }
        }
    };
    class Provider {
        async getNetwork() { calls.push("network"); return { chainId }; }
        async getCode() { calls.push("code"); return options.noCode ? "0x" : "0x6000"; }
        async send(method) { calls.push(method); return [account]; }
        getSigner() { return { getAddress: async () => account }; }
        async getBalance() { return quantity(10n ** 20n); }
    }
    if (options.header) {
        globalThis.window.DecentHead = { getWallet: () => ({
            rawProvider: window.ethereum,
            snapshot: () => ({ connected: !options.sessionDisconnected, address: account, chainId: `0x${chainId.toString(16)}` })
        }) };
    }
    class Contract {
        constructor(address) { this.address = address; }
        async decimals() { calls.push("decimals"); return 6; }
        async balanceOf() { return quantity(10n ** 20n); }
        async allowance() {
            if (options.changeDuringAllowance) changedAccount = true;
            return quantity(0);
        }
        async approve(address, amount) {
            calls.push(["approve", address, amount]);
            return { wait: async () => ({ status: 1 }) };
        }
        callStatic = {
            sendAirdrop: async (...args) => {
                calls.push(["simulate", args]);
                if (options.simulationFails) throw new Error("Simulation failed");
            }
        };
        estimateGas = { sendAirdrop: async () => { calls.push("estimate"); } };
        async sendAirdrop(...args) {
            calls.push(["send", args]);
            return {
                hash: "0xsynthetic",
                wait: async () => {
                    calls.push("receipt");
                    return { status: options.reverted ? 0 : 1, transactionHash: "0xsynthetic" };
                }
            };
        }
    }
    globalThis.ethers = {
        providers: { Web3Provider: Provider },
        Contract,
        utils: { getAddress: value => value, formatEther: value => String(value) }
    };
    globalThis.fetch = async url => {
        calls.push(["abi", String(url)]);
        return { ok: true, json: async () => [] };
    };
    element("campaign-name").value = "Synthetic test";
    element("native-coin-amount").value = "0.000000000000000001";
    await import(`../scripts/sendAirdrop.js?test=${sequence++}`);
    ready();
    await new Promise(resolve => setImmediate(resolve));
    calls.length = 0;
    return {
        calls,
        status: () => element("status").textContent,
        click: async send => {
            await element(send ? "send-airdrop" : "prepare-airdrop").click();
            assert.equal(element("send-airdrop").disabled, false);
            assert.equal(element("prepare-airdrop").disabled, false);
        }
    };
}

test("prepare-only reads decimals but never connects, approves, simulates or sends", async t => {
    const flow = await harness(t, { token: true, chainId: 8453 });
    await flow.click(false);
    assert.deepEqual(flow.calls, ["network", "decimals"]);
    assert.match(flow.status(), /Prepared only/);
    assert.match(flow.status(), /1234567/);
    assert.match(flow.status(), /sending is unavailable/);
});

test("header session is reused without a redundant account request", async t => {
    const flow = await harness(t, { header: true, token: true });
    await flow.click(true);
    assert.match(flow.status(), /Airdrop confirmed/);
    assert.equal(flow.calls.includes('eth_requestAccounts'), false);
});

test("disconnected header session gates send before approvals", async t => {
    const flow = await harness(t, { header: true, sessionDisconnected: true });
    await flow.click(true);
    assert.match(flow.status(), /Connect using the header wallet button/);
    assert.equal(flow.calls.includes('eth_requestAccounts'), false);
    assert.equal(flow.calls.some(call => Array.isArray(call) && ['approve', 'send'].includes(call[0])), false);
});

test("Base and missing bytecode block sending before wallet connection", async t => {
    for (const options of [{ chainId: 8453 }, { noCode: true }]) {
        await t.test(JSON.stringify(options), async t => {
            const flow = await harness(t, options);
            await flow.click(true);
            assert.match(flow.status(), /not confirmed/);
            assert.equal(flow.calls.includes("eth_requestAccounts"), false);
            assert.equal(flow.calls.includes("confirm"), false);
        });
    }
});

test("cancelling review sends no approvals or airdrop", async t => {
    const flow = await harness(t, { token: true, confirm: false });
    await flow.click(true);
    assert.match(flow.status(), /Cancelled before approvals or transfers/);
    assert.equal(flow.calls.some(call => Array.isArray(call) && ["approve", "send"].includes(call[0])), false);
});

test("account change blocks review and transactions", async t => {
    const flow = await harness(t, { token: true, changedAccount: true });
    await flow.click(true);
    assert.match(flow.status(), /account or network changed/);
    assert.equal(flow.calls.includes("confirm"), false);
});

test("account change during allowance read blocks approval and send", async t => {
    const flow = await harness(t, { header: true, token: true, changeDuringAllowance: true });
    await flow.click(true);
    assert.match(flow.status(), /account or network changed/);
    assert.equal(flow.calls.some(call => Array.isArray(call) && ["approve", "send"].includes(call[0])), false);
});

test("confirmed send preserves exact ABI amounts and ordered approval/simulation/receipt", async t => {
    const flow = await harness(t, { token: true });
    await flow.click(true);
    assert.match(flow.status(), /Airdrop confirmed/);
    const transactions = flow.calls.filter(Array.isArray).filter(call => call[0] !== "abi");
    assert.deepEqual(transactions.map(call => call[0]), ["approve", "simulate", "send"]);
    assert.equal(transactions[0][2], "1234567");
    assert.deepEqual(transactions[2][1], [[account], [tokenAddress], [["1234567"]], "1", "Synthetic test", { value: "1" }]);
    assert.ok(flow.calls.indexOf("estimate") < flow.calls.indexOf(transactions[2]));
    assert.equal(flow.calls.at(-1), "receipt");
});

test("simulation failure never submits; reverted receipt never reports confirmation", async t => {
    for (const options of [{ simulationFails: true }, { reverted: true }]) {
        await t.test(JSON.stringify(options), async t => {
            const flow = await harness(t, options);
            await flow.click(true);
            assert.match(flow.status(), /not confirmed/);
            assert.doesNotMatch(flow.status(), /Airdrop confirmed:/);
            if (options.simulationFails) assert.equal(flow.calls.some(call => Array.isArray(call) && call[0] === "send"), false);
            else assert.match(flow.status(), /was submitted; check its receipt/);
        });
    }
});
