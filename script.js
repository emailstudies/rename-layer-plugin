document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  btn.onclick = () => {
    const script = `(function () {
      try {
        var doc = app.activeDocument;
        if (!doc || doc.layers.length === 0) {
          alert("❌ No active document or layers.");
          return;
        }

        app.refresh(); // Ensure visibility state is current
        app.saveToOE("png"); // Save current visible view
        app.echoToOE("✅ saveToOE finished");
      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("📤 Sent saveToOE script to Photopea");
  };

  const buffers = [];

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      const binary = String.fromCharCode(...new Uint8Array(event.data));
      const dataURL = "data:image/png;base64," + btoa(binary);
      console.log("✅ Got image data");

      const win = window.open();
      if (win) {
        win.document.write(\`
          <html><head><title>Exported Frame</title></head>
          <body style="margin:0; background:#111; display:flex; justify-content:center; align-items:center; height:100vh;">
            <img src="\${dataURL}" style="max-width:100%; max-height:100%; image-rendering:pixelated;" />
          </body></html>
        \`);
      } else {
        alert("⚠️ Could not open preview tab.");
      }
    } else if (typeof event.data === "string") {
      console.log("ℹ️ Log from Photopea:", event.data);
    }
  });
});
