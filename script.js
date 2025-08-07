document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return alert("❌ #renameBtn not found");

  let previewTab = null;

  // Clean old listeners
  if (window.__frameListener__) {
    window.removeEventListener("message", window.__frameListener__);
  }

  // Reliable ArrayBuffer → base64
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  window.__frameListener__ = async (event) => {
    if (!(event.data instanceof ArrayBuffer)) return;

    const base64 = arrayBufferToBase64(event.data);
    const dataUrl = "data:image/png;base64," + base64;

    console.log("✅ Got PNG, sending to preview");

    previewTab?.postMessage({
      type: "images",
      images: [dataUrl]
    }, "*");
  };

  window.addEventListener("message", window.__frameListener__);

  btn.onclick = () => {
    previewTab = window.open("preview.html", "previewTab");

    const code = `
      (function () {
        if (!app.documents.length) {
          app.echoToOE("❌ No open document");
          return;
        }
        app.echoToOE("📤 Exporting single frame...");
        app.saveToOE("png");
      })();`;

    parent.postMessage(code, "*");
  };
});
