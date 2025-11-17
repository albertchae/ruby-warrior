import { start, Leaderboard } from "./game.js";
import initVM from "./vm.js";
import { init as initEditor } from "./editor.js";

// Generate share URL with compressed binary code (for share.html)
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

// const SHARE_ORIGIN = "https://codapi.org/embed/?sandbox=ruby&code=";
// const SHARE_ORIGIN = new URL('share.html', window.location.href).href + "?code=";
const SHARE_ORIGIN = "https://runruby.dev?code=";

const introEl = document.getElementById("intro");
const loadingEl = document.getElementById("loading");
const gameEl = document.getElementById("game");
const gameOverlay = document.getElementById("gameOverlay");

const editorEl = document.getElementById("editor");
const readmeEl = document.getElementById("readme");

const startForm = document.getElementById("startForm");
const nameInput = document.getElementById("nameInput");
const skillLevelInput = document.getElementById("levelInput");

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
  const skillLevel = skillLevelInput.value;
  if (!name || !skillLevel) return;

  introEl.classList.add("hidden");
  loadingEl.classList.remove("hidden");

  // Reuse VM if already initialized, otherwise initialize it now
  if (!vm) {
    vm = await initVM();
  }
  const editor = initEditor(editorEl);

  loadingEl.classList.add("hidden");
  gameEl.classList.remove("hidden");
  gameOverlay.classList.remove("hidden");

  const game = await start(vm, name, skillLevel);

  readmeEl.innerText = game.readme;
  editor.setValue(game.playerrb.toString());

  const runBtn = document.getElementById("runBtn");
  const shareBtn = document.getElementById("shareBtn");
  const shareLocalBtn = document.getElementById("shareLocalBtn");
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
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrCodeEl, {
        text: finalUrl,
        width: 256,
        height: 256,
      });
    }

    // Display the URL
    shareUrlEl.textContent = finalUrl;

    // Show the QR code container
    qrCodeContainer?.classList.remove("hidden");

    // Copy to clipboard
    await navigator.clipboard.writeText(finalUrl);
  });

  closeQrBtn?.addEventListener("click", () => {
    qrCodeContainer?.classList.add("hidden");
  });

  copyUrlIcon?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(shareUrlEl.textContent);
  });

  shareLocalBtn?.addEventListener("click", async () => {
    const shareHtmlUrl = new URL('share.html', window.location.href).href + "?code=";
    const finalUrl = await generateCompressedShareUrl(editor.getValue(), shareHtmlUrl);

    await navigator.clipboard.writeText(finalUrl);
    window.open(finalUrl, "_blank");
  });

});
