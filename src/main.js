import "./style.css";

import {
  connectWallet,
  claimReward,
  burnReward,
  getWalletAddress,
  getTreasuryInfo
} from "./web3.js";

import { skins, setSkin } from "./game.js";
import { renderSkinList } from "./game.js";

import {
  initGame,
  disconnectWallet,
  showLeaderboard,
  setWallet
} from "./game.js";

import { donateLunc } from "./web3.js";
let rewardUsed = false;
window.rewardUsed = false;

window.addEventListener("DOMContentLoaded", () => {

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const playBtn = document.getElementById("playBtn");
const leaderboardBtn = document.getElementById("leaderboardBtn");
const treasuryBtn = document.getElementById("treasuryBtn");
const walletInfo = document.getElementById("walletInfo");
const burnBtn = document.getElementById("burnBtn");
const skinBtn = document.getElementById("skinBtn");
const skinBox = document.getElementById("skinBox");
const skinList = document.getElementById("skinList");
const closeSkinBtn = document.getElementById("closeSkinBtn");

if (closeSkinBtn) {
  closeSkinBtn.onclick = () => {

    document.getElementById("skinOverlay").style.display = "none";
    document.getElementById("menuBox").style.display = "flex";

  };
}


if (skinBtn) {
  skinBtn.onclick = () => {

    document.getElementById("menuBox").style.display = "none";
    document.getElementById("skinOverlay").style.display = "flex";

    renderSkinList(); // ini yang generate pilihan skin
  };
}

// Generate skin buttons
skins.forEach(skin => {
  const img = document.createElement("img");
  img.src = skin.frames[0];
  img.style.width = "60px";
  img.style.cursor = "pointer";

  img.onclick = () => {
    setSkin(skin.id);
    skinBox.style.display = "none";
  };

  skinList.appendChild(img);
});

if (burnBtn) {
  burnBtn.onclick = async () => {

    if (window.rewardUsed) return;
    window.rewardUsed = true;

    burnBtn.innerText = "Processing...";
    claimBtn.disabled = true;
    burnBtn.disabled = true;

    try {
      await burnReward(
        Number(document.getElementById("score").innerText)
      );
    } catch (err) {
      console.error(err);
    }

    const actionBox = document.getElementById("gameOverActions");
    if (actionBox) actionBox.style.display = "none";
  };
}

function requireWallet() {
  const wallet = getWalletAddress();
  console.log("Wallet state check:", wallet);
  console.log("Wallet check:", getWalletAddress());
  
  if (!wallet) {
    alert("Please connect wallet first");
    return false;
  }
  return true;
}

if (connectBtn) {
  connectBtn.onclick = async () => {

    const address = await connectWallet();
    if (!address) return;

    setWallet(address);

    connectBtn.style.display = "none";
    walletInfo.style.display = "block";
  };
}

  // ===== PLAY GAME =====
  if (playBtn) {
  playBtn.onclick = () => {

    if (!requireWallet()) return;

    window.startGame();
  };
}

  // ===== DISCONNECT =====
  if (disconnectBtn) {
  disconnectBtn.onclick = () => {

  disconnectWallet(); // reset web3 state

  setWallet(null); // reset game.js state juga

  walletInfo.style.display = "none";
  connectBtn.style.display = "block";

  document.getElementById("menuBox").style.display = "block";
};
}

  // ===== LEADERBOARD =====
  if (leaderboardBtn) {
  leaderboardBtn.onclick = () => {

    if (!requireWallet()) return;

    showLeaderboard();
  };
}

  // ===== TREASURY INFO =====
if (treasuryBtn) {
  treasuryBtn.onclick = async () => {

  const box = document.getElementById("treasuryBox");

  if (box.style.display === "block") {
    box.style.display = "none";
    return;
  }

  if (!requireWallet()) return;

  const data = await getTreasuryInfo();
  if (!data) return;

  box.innerHTML = `
  <h3>Treasury Info</h3>

  <div id="treasuryContent">
    <p>💰 Treasury Balance: ${data.balance.toFixed(2)} LUNC</p>
    <p>📤 Total Distribution: ${data.totalClaimed.toFixed(2)} LUNC</p>
    <p>🔥 Total Burn: ${data.totalBurned.toFixed(2)} LUNC</p>
    <p>⚡️ Available Today: ${data.dailyAvailable.toFixed(2)} LUNC</p>
  </div>

  <div id="donateSection" style="margin-top:15px;">
    <input id="donateAmount" type="number" placeholder="Amount LUNC" min="1" />
    <button id="donateBtn">Donate</button>
  </div>

  <br>
  <button id="refreshTreasuryBtn">🔄 Refresh</button>
  <button onclick="document.getElementById('treasuryBox').style.display='none'">
    Close
  </button>
  `;

  box.style.display = "block";

    // ===== REFRESH BUTTON =====
    const refreshBtn = document.getElementById("refreshTreasuryBtn");

    if (refreshBtn) {
      refreshBtn.onclick = async () => {

        refreshBtn.innerText = "Refreshing...";
        refreshBtn.disabled = true;

        try {
          const newData = await getTreasuryInfo();

          const content = document.getElementById("treasuryContent");

          content.innerHTML = `
            <p>💰 Treasury Balance: ${newData.balance.toFixed(2)} LUNC</p>
            <p>📤 Total Distribution: ${newData.totalClaimed.toFixed(2)} LUNC</p>
            <p>🔥 Total Burn: ${newData.totalBurned.toFixed(2)} LUNC</p>
            <p>⚡ Available Today: ${newData.dailyAvailable.toFixed(2)} LUNC</p>
          `;

        } catch (err) {
          alert("Failed to refresh treasury");
          console.error(err);
        }

        refreshBtn.innerText = "🔄 Refresh";
        refreshBtn.disabled = false;
      };
    }

    // ===== DONATE BUTTON =====
    const donateBtn = document.getElementById("donateBtn");

    if (donateBtn) {
      donateBtn.onclick = async () => {

        const amountInput = document.getElementById("donateAmount");
        const amount = Number(amountInput.value);

        if (!amount || amount <= 0) {
          alert("Enter valid amount");
          return;
        }

        try {
          const result = await donateLunc(amount);
          alert("✅ Donation Success!\nTx: " + result.transactionHash);
        } catch (err) {
          alert("❌ Donation Failed");
          console.error(err);
        }
      };
    }

  };
}

const howToBtn = document.getElementById("howToBtn");
const howToBox = document.getElementById("howToBox");
const closeHowTo = document.getElementById("closeHowTo");

if (howToBtn) {
  howToBtn.onclick = () => {
    howToBox.style.display = "block";
  };
}

if (closeHowTo) {
  closeHowTo.onclick = () => {
    howToBox.style.display = "none";
  };
}


  // ===== INIT GAME =====
  initGame(claimReward);
  const claimBtn = document.getElementById("claimBtn");

if (claimBtn) {
  claimBtn.onclick = async () => {

    if (window.rewardUsed) return;

    window.rewardUsed = true;

    claimBtn.innerText = "Processing...";
    claimBtn.disabled = true;
    burnBtn.disabled = true;

    try {
      await claimReward(
        Number(document.getElementById("score").innerText)
      );
    } catch (err) {
      console.error(err);
    }

    const actionBox = document.getElementById("gameOverActions");
    if (actionBox) actionBox.style.display = "none";
  };
}

});