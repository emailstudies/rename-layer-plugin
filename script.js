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
        if (!doc || doc.layers.length < 2) {
          app.echoToOE("❌ Need at least two root layers.");
          return;
        }

        var tempDoc = app.documents.add(doc.width, doc.height, doc.resolution, "_temp_export", NewDocumentMode.RGB);
        tempDoc.artLayers.add(); // Add an empty layer so it doesn't throw if none exist

        for (var i = doc.layers.length - 1; i >= 0; i--) {
          var layer = doc.layers[i];
          if (layer.typename !== "ArtLayer") continue;

          // Clear temp doc
          app.activeDocument = tempDoc;
          while (tempDoc.layers.length > 0) {
            try { tempDoc.layers[0].remove(); } catch (e) {}
          }

          // Duplicate from root
          app.activeDocument = doc;
          layer.visible = true;
          doc.activeLayer = layer;
          layer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          app.echoToOE("🔍 Exporting: " + layer.name);

          // Send PNG
          app.activeDocument = tempDoc;
          tempDoc.saveToOE("png");
        }

        app.echoToOE("✅ done");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent root-layer export script");
  };
});
