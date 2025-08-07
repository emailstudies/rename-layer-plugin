document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  btn.onclick = () => {
    const script = `(function () {
      try {
        app.refresh();
        app.echoToOE("Width: " + app.activeDocument.width);
        app.echoToOE("Height: " + app.activeDocument.height);
        app.echoToOE("Layers: " + app.activeDocument.layers.length);
        app.saveToOE("png");
        app.echoToOE("✅ saveToOE finished");
      } catch (e) {
        app.echoToOE("❌ " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[🟡] Sent saveToOE script to Photopea");
  };

  let receivedImage = null;

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      console.log("[🟢] Got image ArrayBuffer from Photopea!");
      receivedImage = event.data;

      // Convert to base64
      const binary = String.fromCharCode(...new Uint8Array(receivedImage));
      const base64 = btoa(binary);
      const dataURL = "data:image/png;base64," + base64;

      // Open in new tab
      const imgWindow = window.open();
      if (imgWindow) {
        imgWindow.document.write(
          "<title>Preview</title>" +
          "<body style='margin:0;background:#111;display:flex;justify-content:center;align-items:center;height:100vh'>" +
          "<img src='" + dataURL + "' style='max-width:100%;max-height:100%'/>" +
          "</body>"
        );
      } else {
        alert("❌ Could not open preview tab.");
      }

    } else if (typeof event.data === "string") {
      console.log("[ℹ️] Log from Photopea:", event.data);
    }
  });
});
