document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #renameBtn not found");
    return;
  }

  const collectedFrames = [];
  let imageDataURLs = [];
  let previewWindow = null;

  // Cleanup previous listeners
  if (window.__flipbookMessageListener__) {
    window.removeEventListener("message", window.__flipbookMessageListener__);
  }

  const handleMessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      return;
    }

    if (typeof event.data === "string") {
      if (event.data.trim().startsWith("{") && event.data.includes("Photopea")) return;

      if (event.data === "✅ done") {
        console.log("[flipbook] ✅ All frames received:", collectedFrames.length);

        imageDataURLs = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return "data:image/png;base64," + btoa(binary);
        });

        if (previewWindow && previewWindow.postMessage) {
          previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
        }

        collectedFrames.length = 0;
      } else {
        console.log("[flipbook] ℹ️", event.data);
      }
    }
  };

  window.addEventListener("message", handleMessage);
  window.__flipbookMessageListener__ = handleMessage;

  btn.onclick = () => {
  previewWindow = window.open("preview.html");

  if (!previewWindow) {
    alert("❌ Could not open preview window. Please allow popups.");
    return;
  }

  collectedFrames.length = 0;

  const script = `(function () {
    try {
      var doc = app.activeDocument;
      if (!doc || doc.layers.length === 0) {
        app.echoToOE("❌ No layers in the document.");
        return;
      }

      var layer = doc.layers[0];
      app.echoToOE("🔍 Exporting: " + layer.name + " (" + layer.typename + ")");

      var tempDoc = app.documents.add(doc.width, doc.height, doc.resolution, "_temp_export", NewDocumentMode.RGB);
      tempDoc.artLayers.add(); // Dummy layer to ensure structure

      layer.visible = true;
      doc.activeLayer = layer;
      layer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

      app.activeDocument = tempDoc;
      app.echoToOE("📸 Saving: " + tempDoc.layers[0].name);
      tempDoc.saveToOE("png");

      app.activeDocument = tempDoc;
      tempDoc.close(SaveOptions.DONOTSAVECHANGES);

      app.echoToOE("✅ done");
    } catch (e) {
      app.echoToOE("❌ ERROR: " + e.message);
    }
  })();`;

  parent.postMessage(script, "*");
  console.log("[flipbook] 📤 Sent single-layer export script to Photopea");
};
