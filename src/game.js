let score = 0;
let highscore = 0;
let gameOver = false;
let claimButtonShown = false;
let rewardUsed = false;

import { getWalletAddress } from "./web3.js";

export function setWallet(wallet) {

  const walletStatus = document.getElementById("walletStatus");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (walletStatus) {
    walletStatus.innerText =
      wallet ? "Wallet: " + formatWallet(wallet)
             : "Wallet: Not Connected";
  }

  if (disconnectBtn) {
    disconnectBtn.style.display =
      wallet ? "inline-block" : "none";
  }

  loadHighscoreFromDB();
}

export function disconnectWallet() {

  const walletStatus = document.getElementById("walletStatus");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (walletStatus)
    walletStatus.innerText = "Wallet: Not Connected";

  if (disconnectBtn)
    disconnectBtn.style.display = "none";

  score = 0;
  highscore = 0;

  document.getElementById("score").innerText = 0;
  document.getElementById("highscore").innerText = 0;

  const actionBox = document.getElementById("gameOverActions");
  if (actionBox) actionBox.style.display = "none";

  canvas.style.display = "none";
  document.getElementById("menuBox").style.display = "block";
}

export function showClaimButton() {
  const claimBtn = document.getElementById("claimBtn");
  const burnBtn = document.getElementById("burnBtn");

  if (claimBtn) claimBtn.style.display = "inline-block";
  if (burnBtn) burnBtn.style.display = "inline-block";
}

export function hideClaimButton() {
  const claimBtn = document.getElementById("claimBtn");
  const burnBtn = document.getElementById("burnBtn");

  if (claimBtn) claimBtn.style.display = "none";
  if (burnBtn) burnBtn.style.display = "none";
}

export function resetGameUI() {

  const claimBtn = document.getElementById("claimBtn");
  if (claimBtn) claimBtn.style.display = "none";

  const burnBtn = document.getElementById("burnBtn");
  if (burnBtn) burnBtn.style.display = "none";

  document.getElementById("score").innerText = "0";
  document.getElementById("menuBox").style.display = "block";
}

export function removeClaimButton() {
  const actionBox = document.getElementById("gameOverActions");
  if (actionBox) actionBox.style.display = "none";
}

const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore"); 

import { createClient } from "@supabase/supabase-js";

// ===== SUPABASE =====
const supabaseUrl = "https://ejcyqjnovijfqqxiutvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqY3lxam5vdmlqZnFxeGl1dHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzQzNjMsImV4cCI6MjA4NzMxMDM2M30.kyVO2g-1XaY8ePMG4B6eYowH3jFGtUfLv-ar7Duhk9U";

const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ===== CANVAS =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const BASE_RATIO = 9 / 16; // portrait ratio

function resizeCanvas() {
  let width = window.innerWidth;
  let height = window.innerHeight;

  const currentRatio = width / height;

  if (currentRatio > BASE_RATIO) {
    // layar terlalu lebar (desktop)
    width = height * BASE_RATIO;
  } else {
    // layar terlalu tinggi (mobile portrait normal)
    height = width / BASE_RATIO;
  }

  canvas.width = width;
  canvas.height = height;

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ===== LOAD 2 FRAME IMAGES =====
const birdFrame1 = new Image();
birdFrame1.src = "/terra1.png";

const birdFrame2 = new Image();
birdFrame2.src = "/terra2.png";

// ===== LOAD PIPE IMAGE =====
const pipeImg = new Image();
pipeImg.src = "/blue_pipe.png";

// ===== LOAD BACKGROUND =====
const bgImg = new Image();
bgImg.src = "/japan.png";

let bgX = 0;
const bgSpeed = 1.5;

let currentFrame=0;
let frameTimer=0;
const frameInterval=0.12;

// ===== AUDIO =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let lastJumpSoundTime = 0;

function drawBackground() {
  if (!bgImg.complete) return;

  const scale = Math.max(
    canvas.width / bgImg.width,
    canvas.height / bgImg.height
  );

  const scaledWidth = bgImg.width * scale;
  const scaledHeight = bgImg.height * scale;

  bgX -= bgSpeed;

  if (bgX <= -scaledWidth) {
    bgX = 0;
  }

  ctx.drawImage(bgImg, bgX, 0, scaledWidth, scaledHeight);
  ctx.drawImage(bgImg, bgX + scaledWidth, 0, scaledWidth, scaledHeight);
}

function playJumpSound(){

  const now = audioCtx.currentTime;

  // Prevent sound spam (minimal 100ms interval)
  if(now - lastJumpSoundTime < 0.1){
    return;
  }

  lastJumpSoundTime = now;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine"; // lebih lembut dari square

  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);

  // Volume lebih kecil
  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

function playCrashSound(){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type="square";
  osc.frequency.setValueAtTime(120,audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40,audioCtx.currentTime+0.3);
  gain.gain.setValueAtTime(0.2,audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime+0.3);
}

function playScoreSound(){

  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // Bell lebih cocok pakai sine / triangle
  osc.type = "sine";

  // Nada bell tinggi
  osc.frequency.setValueAtTime(1500, now);
  osc.frequency.exponentialRampToValueAtTime(2200, now + 0.15);

  // Envelope bell (lebih sustain sedikit)
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.4);
}

// ===== STATE =====
const BENANCE_CONTRACT = "terra1ctvrh09s3q2tgxm88vt6zexle8wcf22qwhxe5qa2wchc9e2ynw3qhvksyl";
const REQUIRED_BALANCE = 1000000000 * 0; // 0B BENANCE (dec 6)
const CONTRACT_ADDRESS = "terra1ry527k7p9dkyvant890u2pgau94xqr4w0ywv8qt5qd2c5hp68gxs2ksydq";
  
let gameRunning=false;

let isFlapping = false;
let flapTimer = 0;
const flapDuration = 0.25; // durasi animasi flap (detik)

let birdY=200;
let velocity=0;
let gravity=1200;
let jumpForce=-450;

let pipes=[];
let pipeTimer=0;
let pipeInterval=1.5;

let lastTime=0;
gameOver=false;
let flashAlpha=0;
claimButtonShown = false;

const birdSize=70;
const pipeWidth=70;
const basePipeGap = 300;
let currentPipeGap = basePipeGap;
let currentLevel = 1;
const pipeSpeed=200;

function formatWallet(addr){
  if (!addr) return "Not Connected";
  return addr.slice(0,6) + "..." + addr.slice(-4);
}

async function checkBenanceBalance(wallet){

  try {

    // Buat query JSON
    const queryMsg = {
      balance: {
        address: wallet
      }
    };

    // Encode ke base64
    const base64Query = btoa(JSON.stringify(queryMsg));

    const response = await fetch(
      "https://terra-classic-lcd.publicnode.com/cosmwasm/wasm/v1/contract/"
      + BENANCE_CONTRACT
      + "/smart/"
      + base64Query
    );

    const result = await response.json();

    if(!result.data || !result.data.balance){
      return 0;
    }

    const balance = parseInt(result.data.balance);
    return balance;

  } catch (error){
    console.log("Balance check error:", error);
    return 0;
  }
}

function showInsufficientBalance(){

  document.getElementById("menuBox").innerHTML = `
    <h2>Balance Not Enough</h2>
    <p>You need 1,000,000,000 BENANCE to play.</p>

    <button onclick="window.open(
      'https://garuda-defi.org/market/terra174euun47r0xhwkslza67avnm5r4gtxnckfeeuud39c0ahtu5hryq57vel3',
      '_blank'
    )">Buy BENANCE</button>

    <br>
    <button onclick="location.reload()">Back</button>
  `;
}  
  
// ===== CONNECT =====
async function connectDesktop(){

  if(!window.keplr){
    alert("Keplr not detected");
    return;
  }

  await window.keplr.enable("columbus-5");

  const signer = window.getOfflineSigner("columbus-5");
  const accounts = await signer.getAccounts();

  const wallet = accounts[0].address;

  await loadHighscoreFromDB();

  const balance = await checkBenanceBalance(wallet);

  if(balance >= REQUIRED_BALANCE){
    startGame();
  } else {
    showInsufficientBalance();
  }
}
  
// ===== LOAD HIGHSCORE =====
async function loadHighscoreFromDB() {
  const wallet = getWalletAddress();
if (!wallet) return;

  try {
    const { data, error } = await supabaseClient
      .from("leaderboard")
      .select("highscore")
      .eq("wallet", wallet)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Load highscore error:", error);
      return;
    }

    highscore = data?.highscore || 0;
    highscoreEl.innerText = highscore;

  } catch (err) {
    console.error("Unexpected load error:", err);
  }
}

// ===== SAVE SCORE (ONLY IF HIGHER) =====
async function saveScoreToDB() {
  const wallet = getWalletAddress();
if (!wallet) return;

  // hanya save jika lebih tinggi
  if (score <= highscore) return;

  try {
    highscore = score;
    highscoreEl.innerText = highscore;

    const { error } = await supabaseClient
      .from("leaderboard")
      .upsert({
        wallet: wallet,
        highscore: highscore
      }, { onConflict: "wallet" });

    if (error) {
      console.error("Save score error:", error);
    }

  } catch (err) {
    console.error("Unexpected save error:", err);
  }
}

// ===== LEADERBOARD =====
export async function showLeaderboard() {

  const { data } = await supabaseClient
    .from("leaderboard")
    .select("*")
    .order("highscore", { ascending: false })
    .limit(10);

  let html = "<h3>Top 10 Leaderboard</h3>";

  data.forEach((row, index) => {
    html += `
      <div>
        ${index + 1}. 
        ${formatWallet(row.wallet)} 
        - ${row.highscore}
      </div>
    `;
  });

  html += `<br><button id="backBtn">Back</button>`;

  const box = document.getElementById("leaderboardBox");
  box.innerHTML = html;
  box.style.display = "block";

  document.getElementById("menuBox").style.display = "none";

  document.getElementById("backBtn").onclick = () => {
    box.style.display = "none";
    document.getElementById("menuBox").style.display = "block";
  };
}

// ===== START GAME =====
function startGame(){

  claimButtonShown = false;
  gameOver = false;

  // 🔥 PENTING: HIDE GAME OVER ACTIONS
  const actionBox = document.getElementById("gameOverActions");
  if (actionBox) actionBox.style.display = "none";

  // HIDE MAIN MENU
  const menuBox = document.getElementById("menuBox");
  if (menuBox) menuBox.style.display = "none";

  const leaderboardBox = document.getElementById("leaderboardBox");
  if (leaderboardBox) leaderboardBox.style.display = "none";

  const connectChoice = document.getElementById("connectChoice");
  if (connectChoice) connectChoice.style.display = "none";

  canvas.style.display = "block";

  const wallet = getWalletAddress();

  document.getElementById("walletStatus").innerText =
      wallet ? "Wallet: " + formatWallet(wallet)
             : "Wallet: Not Connected";

  gameRunning = true;
}

// ===== INPUT =====
function jump(){

  if(!gameRunning) return;
  velocity = jumpForce;
  playJumpSound();

  isFlapping = true;
  flapTimer = 0;
}

window.addEventListener("keydown",e=>{if(e.code==="Space")jump();});
window.addEventListener("touchstart",jump);
window.addEventListener("mousedown", jump);
canvas.addEventListener("click", function(e){

  if(!gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = canvas.width / 2;
  const restartY = canvas.height / 2 + 20;

  // Area restart text (lebar 300px, tinggi 40px)
  if(
    x > centerX - 150 &&
    x < centerX + 150 &&
    y > restartY - 20 &&
    y < restartY + 20
  ){
    resetGame();
  }
});

// ===== PIPE =====
function createPipe(){

  const top = Math.random()*(canvas.height-currentPipeGap-100)+50;

  pipes.push({
    x: canvas.width,
    baseTop: top,
    top: top,
    bottom: top + currentPipeGap,
    passed:false,
    offset: Math.random() * Math.PI * 2 // untuk gerakan sin wave
  });
}

function handleGameOver() {

  if (gameOver) return;

  gameOver = true;
  gameRunning = false;

  flashAlpha = 0.6;

  playCrashSound();
  saveScoreToDB();

  window.rewardUsed = false;

  const claimBtn = document.getElementById("claimBtn");
  const burnBtn  = document.getElementById("burnBtn");

  if (claimBtn) {
    claimBtn.disabled = false;
    claimBtn.innerText = "Claim LUNC";
  }

  if (burnBtn) {
    burnBtn.disabled = false;
    burnBtn.innerText = "🔥 Burn LUNC";
  }

  const wallet = getWalletAddress();

  if (score >= 5 && wallet) {
    const actionBox = document.getElementById("gameOverActions");
    if (actionBox) actionBox.style.display = "block";
  }
}

// ===== LOOP =====
function gameLoop(timestamp){

  if(!lastTime)lastTime=timestamp;
  let delta=(timestamp-lastTime)/1000;
  lastTime=timestamp;

  if(gameRunning){

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if(!gameOver){

      velocity+=gravity*delta;
      birdY+=velocity*delta;

      // ===== MATI JIKA SENTUH TANAH =====
      if (birdY + birdSize >= canvas.height) {
        birdY = canvas.height - birdSize;
        handleGameOver();
      }

      pipeTimer+=delta;
      if(pipeTimer>pipeInterval){
        createPipe();
        pipeTimer=0;
      }

      for(let i=pipes.length-1;i>=0;i--){
  let pipe=pipes[i];
  pipe.x-=pipeSpeed*delta;
        // ===== LEVEL 4 DYNAMIC PIPE =====
if(currentLevel === 4){

  const amplitude = 40; // tinggi gerakan
  const speed = 2;      // kecepatan gerakan

  pipe.top = pipe.baseTop + Math.sin(timestamp/1000 * speed + pipe.offset) * amplitude;
  pipe.bottom = pipe.top + currentPipeGap;

}
else{
  pipe.top = pipe.baseTop;
  pipe.bottom = pipe.top + currentPipeGap;
}

  // ===== PIPE ATAS (DIBALIK) =====
  ctx.save();
  ctx.translate(pipe.x + pipeWidth/2, pipe.top);
  ctx.scale(1, -1);

  ctx.drawImage(
    pipeImg,
    -pipeWidth/2,
    0,
    pipeWidth,
    pipe.top
  );

  ctx.restore();

  // ===== PIPE BAWAH =====
  ctx.drawImage(
    pipeImg,
    pipe.x,
    pipe.bottom,
    pipeWidth,
    canvas.height - pipe.bottom
  );

        if(
          100<pipe.x+pipeWidth &&
          100+birdSize>pipe.x &&
          (birdY<pipe.top || birdY+birdSize>pipe.bottom)
        ){
          handleGameOver();
        }

        // ===== LEVEL SYSTEM =====
if(score >= 30){
  currentLevel = 4;
  currentPipeGap = basePipeGap * 0.9 * 0.9;
}
else if(score >= 20){
  currentLevel = 3;
  currentPipeGap = basePipeGap * 0.9 * 0.9;
}
else if(score >= 10){
  currentLevel = 2;
  currentPipeGap = basePipeGap * 0.9;
}
else{
  currentLevel = 1;
  currentPipeGap = basePipeGap;
}
        if(!pipe.passed && pipe.x<100){
  pipe.passed=true;
  score++;
  document.getElementById("score").innerText=score;

  playScoreSound(); // ← TAMBAHKAN INI
}
        if(pipe.x<-pipeWidth){pipes.splice(i,1);}
      }
    }

    // FRAME ANIMATION
    if(isFlapping){

  flapTimer += delta;
  frameTimer += delta;

  if(frameTimer > frameInterval){
    currentFrame = currentFrame === 0 ? 1 : 0;
    frameTimer = 0;
  }

  if(flapTimer > flapDuration){
    isFlapping = false;
    currentFrame = 0; // kembali ke posisi diam
  }

}else{
  currentFrame = 0; // diam
}

    const birdImage=currentFrame===0?birdFrame1:birdFrame2;
    ctx.drawImage(birdImage,100,birdY,birdSize,birdSize);

    // FLASH EFFECT
    if(flashAlpha>0){
      ctx.fillStyle="rgba(255,0,0,"+flashAlpha+")";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      flashAlpha-=delta;
    }

    // ===== GAME OVER TEXT CENTER FIX =====
    if(gameOver){

  ctx.fillStyle = "black";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "GAME OVER",
    canvas.width / 2,
    canvas.height / 2 - 40
  );

  // Restart Text
  ctx.font = "24px Arial";
  ctx.fillText(
    "Tap here to start again",
    canvas.width / 2,
    canvas.height / 2 + 20
  );
}
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

function resetGame(){

  score = 0;
  document.getElementById("score").innerText = 0;

  pipes = [];
  velocity = 0;
  birdY = 200;
  pipeTimer = 0;

  gameOver = false;
  flashAlpha = 0;

  const actionBox = document.getElementById("gameOverActions");
  if (actionBox) actionBox.style.display = "none";

  gameRunning = true;
}

function backToMenu(){
  document.getElementById("connectChoice").style.display = "none";
  document.getElementById("menuBox").style.display = "block";
}  
   
function hideGameOverActions(){
  const actionBox = document.getElementById("gameOverActions");
  if (actionBox) actionBox.style.display = "none";
}

window.connectDesktop = connectDesktop;
window.showLeaderboard = showLeaderboard;
window.backToMenu = backToMenu;
window.startGame = startGame;
    

export function initGame(claimCallback) {
  window.claimFromWeb3 = claimCallback;
}





















































