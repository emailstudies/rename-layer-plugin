document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return alert("❌ #renameBtn not found");

  let previewTab = null;

  // Listen once for the ArrayBuffer from Photopea
  if (window.__frameListener__) {
    window.removeEventListener("message", window.__frameListener__);
  }

  window.__frameListener__ = (event) => {
    if (!(event.data instanceof ArrayBuffer)) return;

    const binary = String.fromCharCode(...new Uint8Array(event.data));
    const dataUrl = "data:image/png;base64," + btoa(binary);

    console.log("✅ Got PNG ArrayBuffer, sending to preview.html");

    // Send to preview tab
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
