import { init } from "./editor.js";

const editorEl = document.getElementById("editor");

async function getCodeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  let encodedCode = urlParams.get("code");

  if (!encodedCode) {
    return "";
  }

  try {
    encodedCode = encodedCode.slice("data:;base64,".length);

    const binaryString = atob(encodedCode);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const stream = new Blob([bytes]).stream().pipeThrough(
      new DecompressionStream("deflate-raw")
    );
    const decompressed = await new Response(stream).text();
    return decompressed;
  } catch (e) {
    console.error("Failed to decode shared code:", e);
    return "";
  }
}

let editor;

getCodeFromUrl().then((code) => {
  editor = init(editorEl, {
    value: code,
    readOnly: true,
  });
});

const copyCodeBtn = document.getElementById("copyCodeBtn");
copyCodeBtn?.addEventListener("click", async () => {
  await navigator.clipboard.writeText(editor.getValue());
});

const copyUrlBtn = document.getElementById("copyUrlBtn");
copyUrlBtn?.addEventListener("click", async () => {
  await navigator.clipboard.writeText(window.location.href);
});
