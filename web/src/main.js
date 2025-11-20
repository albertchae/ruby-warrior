import { start, Leaderboard } from "./game.js";
import { cacheKey, getPlayerRecord } from "./storage.js";
import initVM from "./vm.js";
import { init as initEditor } from "./editor.js";

// UNUSED: Generate share URL with compressed binary code (would allow ~3-5x more Ruby code in QR codes)
// To use this, the page at baseUrl needs to implement decompression logic
async function generateCompressedShareUrl(code, baseUrl) {
  const stream = new Blob([code]).stream().pipeThrough(
    new CompressionStream("deflate-raw")
  );
  const buffer = await new Response(stream).arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return baseUrl + encodeURIComponent("data:;base64," + base64);
}

// Generate share URL with simple base64 encoding (for runruby.dev)
function generateBase64ShareUrl(code, baseUrl) {
  const base64 = btoa(code);
  return baseUrl + base64;
}

const SHARE_ORIGIN = "https://runruby.dev?code=";

const introEl = document.getElementById("intro");
const introHeaderEl = document.getElementById("intro-header");
const loadingEl = document.getElementById("loading");
const gameEl = document.getElementById("game");
const gameOverlay = document.getElementById("gameOverlay");

const editorEl = document.getElementById("editor");
const readmeEl = document.getElementById("readme");

const startForm = document.getElementById("startForm");
const nameInput = document.getElementById("nameInput");
const levelNumberInput = document.getElementById("levelInput");

// Show Safari warning if user is on Safari or iOS
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isSafari || isIOS) {
  document.getElementById("safariWarning")?.classList.remove("hidden");
}

// Initialize VM and populate homepage leaderboard
let vm = null;
const homepageLeaderboard = new Leaderboard(null, 'homepage-leaderboard-body', null);
homepageLeaderboard.showLoading();

(async () => {
  vm = await initVM();
  homepageLeaderboard.vm = vm;
  homepageLeaderboard.update();
})();

startForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const levelNumber = levelNumberInput.value;
  if (!name || !levelNumber) return;

  // Guarantee player name uniqueness. Even though the game supports resuming off a saved profile,
  // we will not allow more than one playthrough per name for simplified leaderboard handling.
  // Otherwise calculating time elapsed and preventing other users from resuming your game would require more work.
  // Bypass with DEBUG_RESUME query param for debugging/resuming
  const debugResume = new URLSearchParams(window.location.search).has('DEBUG_RESUME');
  if (!debugResume && getPlayerRecord(cacheKey(name, levelNumber))) {
    nameInput.setCustomValidity("Name already taken, please enter a unique name for the leaderboard!");
    nameInput.reportValidity();
    return;
  }
  nameInput.setCustomValidity("");

  introEl.classList.add("hidden");
  introHeaderEl.classList.add("hidden");
  loadingEl.classList.remove("hidden");

  // Reuse VM if already initialized, otherwise initialize it now
  if (!vm) {
    vm = await initVM();
  }
  const editor = initEditor(editorEl);

  loadingEl.classList.add("hidden");
  gameEl.classList.remove("hidden");
  gameOverlay.classList.remove("hidden");

  const game = await start(vm, name, levelNumber);

  readmeEl.innerText = game.readme;
  editor.setValue(game.playerrb.toString());

  const runBtn = document.getElementById("runBtn");
  const shareBtn = document.getElementById("shareBtn");
  const turnOutput = document.getElementById("turn");

  runBtn?.addEventListener("click", async () => {
    runBtn.setAttribute("disabled", true);
    try {
      let success = await game.play(editor.getValue(), turnOutput);

      if (success) {
        readmeEl.innerText = game.readme;
        editor.setValue(game.playerrb);
      }
    } catch (e) {
      console.error(e);
    }
    runBtn.removeAttribute("disabled");
  });

  const interruptBtn = document.querySelector("#interruptBtn");
  interruptBtn?.addEventListener("click", () => {
    game.interrupt();
  });

  const pauseResumeBtn = document.querySelector("#pauseResumeBtn");
  pauseResumeBtn?.addEventListener("click", () => {
    game.pauseResume();
  });

  const qrCodeContainer = document.getElementById("qrCodeContainer");
  const qrCodeEl = document.getElementById("qrcode");
  const shareUrlEl = document.getElementById("shareUrl");
  const closeQrBtn = document.getElementById("closeQrBtn");
  const copyUrlIcon = document.getElementById("copyUrlIcon");

  shareBtn?.addEventListener("click", async () => {
    const finalUrl = generateBase64ShareUrl(editor.getValue(), SHARE_ORIGIN);

    // Clear previous QR code
    qrCodeEl.innerHTML = "";

    // Generate new QR code
    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrCodeEl, {
          text: finalUrl,
          width: 400,
          height: 400,
          correctLevel: QRCode.CorrectLevel.L, // Use Low error correction for more data capacity
        });
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      qrCodeEl.innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-lg text-center">
        <p class="font-bold mb-2">QR Code Too Large</p>
        <p class="text-sm">Your code is too large for a QR code (${finalUrl.length} characters).</p>
        <p class="text-sm mt-2">Please copy the URL below or take a picture of your code directly instead.</p>
      </div>`;
    }

    // Display the URL
    shareUrlEl.textContent = finalUrl;

    // Show the QR code container
    qrCodeContainer?.classList.remove("hidden");

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(finalUrl);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  });

  closeQrBtn?.addEventListener("click", () => {
    qrCodeContainer?.classList.add("hidden");
  });

  copyUrlIcon?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(shareUrlEl.textContent);
  });

  // Restart button and dialog
  const restartBtn = document.getElementById("restartBtn");
  const restartDialog = document.getElementById("restartDialog");
  const restartConfirmInput = document.getElementById("restartConfirmInput");
  const cancelRestartBtn = document.getElementById("cancelRestartBtn");
  const confirmRestartBtn = document.getElementById("confirmRestartBtn");

  restartBtn?.addEventListener("click", () => {
    restartConfirmInput.value = "";
    confirmRestartBtn.disabled = true;
    restartDialog.show();
  });

  restartConfirmInput?.addEventListener("input", () => {
    confirmRestartBtn.disabled = restartConfirmInput.value.toLowerCase() !== "restart";
  });

  cancelRestartBtn?.addEventListener("click", () => {
    restartDialog.hide();
  });

  confirmRestartBtn?.addEventListener("click", () => {
    window.location.reload();
  });

});
