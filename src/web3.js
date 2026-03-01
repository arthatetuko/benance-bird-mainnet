import {
  SigningCosmWasmClient,
  CosmWasmClient
} from "@cosmjs/cosmwasm-stargate";

import { GasPrice } from "@cosmjs/stargate";
import { removeClaimButton } from "./game.js";

const RPC = "https://terra-classic-rpc.publicnode.com";
const CHAIN_ID = "columbus-5";
const CONTRACT_ADDRESS = "terra14x7qqp7m5h6gp7ss5vq0hcnlqgl2dsmgr77wfj6sldrfzp0fpu3qk7gs56";

let client = null;
let walletAddress = null;



export function getWalletAddress() {
  return walletAddress;
}

export async function connectWallet() {
  if (!window.keplr) {
    alert("Install Keplr");
    return null;
  }

  await window.keplr.enable(CHAIN_ID);

  const offlineSigner = window.getOfflineSigner(CHAIN_ID);
  const accounts = await offlineSigner.getAccounts();

  walletAddress = accounts[0].address;

  const gasPrice = GasPrice.fromString("0.15uluna");

  client = await SigningCosmWasmClient.connectWithSigner(
    RPC,
    offlineSigner,
    { gasPrice }
  );

  alert("Connected: " + walletAddress);

  return walletAddress;
}

export async function claimReward(score) {

  if (!walletAddress) {
    alert("Connect wallet first");
    return;
  }

  try {

    // 1️⃣ Get signature from backend
    const res = await fetch(
      "https://benance-backend.vercel.app/api/sign",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          score: score
        })
      }
    );

    const data = await res.json();

    if (!data.signature || !data.timestamp) {
      alert("Invalid signature");
      return;
    }

    // 2️⃣ Execute contract
    const result = await client.execute(
      walletAddress,
      CONTRACT_ADDRESS,
      {
        claim: {
          score: score,
          timestamp: data.timestamp,
          signature: data.signature,
          burn: false
        }
      },
      "auto"
    );

    alert("✅ Claim Success!\nTX: " + result.transactionHash);

  } catch (error) {

  console.error(error);

  const message = error?.message || "";

  if (message.toLowerCase().includes("cooldown")) {

    alert("Cooldown active - please wait for 60s to claim another rewards");

  } else {

    alert("Claim failed");

  }
}
}

export async function burnReward(score) {

  if (!walletAddress) {
    alert("Connect wallet first");
    return;
  }

  try {

    const res = await fetch(
      "https://benance-backend.vercel.app/api/sign",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          score: score
        })
      }
    );

    const data = await res.json();

    if (!data.signature || !data.timestamp) {
      alert("Invalid signature");
      return;
    }

    const result = await client.execute(
      walletAddress,
      CONTRACT_ADDRESS,
      {
        claim: {
          score: score,
          timestamp: data.timestamp,
          signature: data.signature,
          burn: true
        }
      },
      "auto"
    );

    alert("🔥 Burn Success!\nTX: " + result.transactionHash);

  } catch (error) {

  console.error(error);

  const message = error?.message || "";

  if (message.toLowerCase().includes("cooldown")) {

    alert("Cooldown active - please wait for 60s to burn another rewards");

  } else {

    alert("Claim failed");

  }
}
}

export async function getTreasuryInfo() {

    const queryClient = await CosmWasmClient.connect(RPC);

    // 1️⃣ Balance
    const balance = await queryClient.getBalance(CONTRACT_ADDRESS, "uluna");

    const balanceLunc = Number(balance.amount) / 1_000_000;

    // 2️⃣ Total Claimed
    const totalClaimed = await queryClient.queryContractSmart(
        CONTRACT_ADDRESS,
        { total_claimed: {} }
    );

    // 3️⃣ Total Burned
    const totalBurned = await queryClient.queryContractSmart(
        CONTRACT_ADDRESS,
        { total_burned: {} }
    );

    // 4️⃣ Daily Available
    const dailyAvailable = await queryClient.queryContractSmart(
        CONTRACT_ADDRESS,
        { daily_available: {} }
    );

    return {
        balance: balanceLunc,
        totalClaimed: Number(totalClaimed) / 1_000_000,
        totalBurned: Number(totalBurned) / 1_000_000,
        dailyAvailable: Number(dailyAvailable) / 1_000_000
    };
}

export async function donateLunc(amountLunc) {

  if (!walletAddress) {
    alert("Connect wallet first");
    return;
  }

  const amount = {
    denom: "uluna",
    amount: (amountLunc * 1_000_000).toString()
  };

  const result = await client.sendTokens(
    walletAddress,
    CONTRACT_ADDRESS,
    [amount],
    "auto"
  );

  return result;
}

export function disconnectWallet() {
  walletAddress = null;
  client = null;

  console.log("Wallet after disconnect:", walletAddress);
}
