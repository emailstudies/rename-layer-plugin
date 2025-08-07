document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return alert("❌ #renameBtn not found");

  let previewTab = null;
  let lastPngDataUrl = null;

  // --- Helper: Convert ArrayBuffer to Base64 PNG ---
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // --- Listen to messages from Photopea and Preview tab ---
  if (window.__frameListener__) {
    window.removeEventListener("message", window.__frameListener__);
  }

  window.__frameListener__ = async (event) => {
    if (event.data instanceof ArrayBuffer) {
      console.log("📦 Got ArrayBuffer from Photopea");

      const base64 = arrayBufferToBase64(event.data);
      lastPngDataUrl = "data:image/png;base64," + base64;

      console.log("✅ Converted to DataURL");
      // Wait for preview to ask for it via "✅ next"
    }

    if (typeof event.data === "string" && event.data === "✅ next") {
      console.log("📨 Got ✅ next from preview");

      if (lastPngDataUrl && previewTab) {
        previewTab.postMessage({
          type: "images",
          images: [lastPngDataUrl],
        }, "*");

        console.log("✅ Sent image to preview");
      } else {
        console.warn("⚠️ No image ready to send yet.");
      }
    }
  };

  window.addEventListener("message", window.__frameListener__);

  // --- Click to trigger export and open preview ---
  btn.onclick = () => {
    previewTab = window.open("preview.html", "previewTab");
    lastPngDataUrl = null;

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
