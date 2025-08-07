document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return alert("❌ #renameBtn not found");

  let previewTab = null;
  let lastPngDataUrl = null;
  let bufferReady = false;

  // --- Helper: Convert ArrayBuffer to base64 PNG ---
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // --- Message listener for ArrayBuffer + preview messages ---
  if (window.__frameListener__) {
    window.removeEventListener("message", window.__frameListener__);
  }

  window.__frameListener__ = (event) => {
    // Step 1: When Photopea sends the PNG
    if (event.data instanceof ArrayBuffer) {
      console.log("📦 Got ArrayBuffer from Photopea");

      const base64 = arrayBufferToBase64(event.data);
      lastPngDataUrl = "data:image/png;base64," + base64;
      bufferReady = true;

      console.log("✅ Image is ready. Opening preview...");
      previewTab = window.open("preview.html", "previewTab");
    }

    // Step 2: When preview asks for it
    if (event.data === "✅ next") {
      console.log("📨 Got ✅ next from preview");

      if (bufferReady && lastPngDataUrl && previewTab) {
        previewTab.postMessage({
          type: "images",
          images: [lastPngDataUrl],
        }, "*");
        console.log("✅ Sent image to preview");
      } else {
        console.warn("⚠️ Image not ready yet. Please wait...");
      }
    }
  };

  window.addEventListener("message", window.__frameListener__);

  // --- Trigger export ---
  btn.onclick = () => {
    lastPngDataUrl = null;
    bufferReady = false;
    previewTab = null;

    const code = `
      (function () {
        if (!app.documents.length) {
          app.echoToOE("❌ No document open");
          return;
        }
        app.echoToOE("📤 Exporting single frame...");
        app.saveToOE("png");
      })();`;

    parent.postMessage(code, "*");
  };
});
