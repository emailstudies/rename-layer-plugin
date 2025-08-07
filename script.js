document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return alert("❌ No #renameBtn found");

  let imageTab = null;

  if (window.__saveToOEListener__) {
    window.removeEventListener("message", window.__saveToOEListener__);
  }

  const handleImage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(event.data);
      const binary = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), "");
      const base64 = btoa(binary);
      const dataUrl = "data:image/png;base64," + base64;

      if (imageTab) {
        imageTab.document.body.innerHTML = `<img src="${dataUrl}" style="max-width:100%;" />`;
      }
    }
  };

  window.addEventListener("message", handleImage);
  window.__saveToOEListener__ = handleImage;

  btn.onclick = () => {
    imageTab = window.open("", "_blank");
    if (!imageTab) {
      alert("❌ Please allow popups for this site");
      return;
    }
    imageTab.document.write("<p>⏳ Waiting for PNG...</p>");

    const script = `
      try {
        if (!app.activeDocument) {
          app.echoToOE("❌ No active document.");
        } else {
          app.echoToOE("🔄 Calling saveToOE");
          app.refresh();
          app.saveToOE("png");
        }
      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    `;
    parent.postMessage(script, "*");
    console.log("[debug] 📤 Requested saveToOE export");
  };
});
