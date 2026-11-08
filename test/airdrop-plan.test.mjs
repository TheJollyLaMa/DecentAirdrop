import test from "node:test";
import assert from "node:assert/strict";
import { amountToUnits, prepareAirdrop } from "../scripts/airdrop-plan.mjs";
import { deployedNetwork, NETWORKS } from "../scripts/networks.mjs";

const a = `0x${"1".repeat(40)}`;
const b = `0x${"2".repeat(40)}`;
const t = `0x${"a".repeat(40)}`;
const input = () => ({ campaign: "Pilot", wallets: [a, b], nativeAmount: "0", tokens: [{ address: t, amount: "1.234567", decimals: 6 }] });

test("six-decimal token totals and per-recipient amounts match the deployed ABI shape", () => {
    const plan = prepareAirdrop(input());
    assert.deepEqual(plan.tokenAmounts, [["1234567", "1234567"]]);
    assert.deepEqual(plan.approvals, [{ address: t, total: "2469134" }]);
    assert.equal(plan.totalNative, "0");
    assert.equal(amountToUnits("9007199254740993.000001", 6), 9007199254740993000001n);
    assert.equal(amountToUnits("1", 0), 1n);
    assert.equal(amountToUnits("0.000000000000000001", 18), 1n);
});

test("native totals remain exact with mixed assets", () => {
    const value = input();
    value.nativeAmount = "0.000000000000000001";
    const plan = prepareAirdrop(value);
    assert.equal(plan.nativeAmount, "1");
    assert.equal(plan.totalNative, "2");
});

test("invalid amounts, excess precision, invalid decimals and overflow are rejected", () => {
    for (const value of ["-1", "1e6", ".1", "1.", "NaN", "1,000", " 1", "", 1]) {
        assert.throws(() => amountToUnits(value, 6), /decimal strings/);
    }
    assert.throws(() => amountToUnits("0.0000001", 6), /decimal places/);
    for (const decimals of [-1, 256, NaN, 1.5, "6"]) assert.throws(() => amountToUnits("1", decimals), /decimals/);
    assert.throws(() => amountToUnits((1n << 256n).toString(), 0), /uint256/);
    const value = input();
    value.tokens[0].amount = ((1n << 256n) - 1n).toString();
    value.tokens[0].decimals = 0;
    assert.throws(() => prepareAirdrop(value), /Token total exceeds/);
});

test("bad recipients, duplicate rows and empty distributions fail explicitly", () => {
    for (const wallets of [[], [a, a], [`0x${"0".repeat(40)}`], ["not-a-wallet"]]) {
        assert.throws(() => prepareAirdrop({ ...input(), wallets }));
    }
    assert.throws(() => prepareAirdrop({ ...input(), campaign: " " }), /campaign/);
    assert.throws(() => prepareAirdrop({ ...input(), tokens: [] }), /native amount/);
    const value = input();
    assert.throws(() => prepareAirdrop({ ...value, tokens: [...value.tokens, ...value.tokens] }), /only once/);
    value.tokens[0].amount = "0";
    assert.throws(() => prepareAirdrop(value), /positive/);
});

test("Base is modeled but cannot send before an approved deployment; placeholders are absent", () => {
    assert.equal(NETWORKS[8453].name, "Base");
    assert.throws(() => deployedNetwork(8453), /no configured/);
    assert.throws(() => deployedNetwork(1), /no configured/);
    assert.throws(() => deployedNetwork(123), /no configured/);
    assert.match(deployedNetwork(10).address, /^0x[0-9a-fA-F]{40}$/);
});
