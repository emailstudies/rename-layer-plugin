document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #renameBtn not found");
    return;
  }

  const collectedFrames = [];
  let previewWindow = null;

  if (window.__flipbookMessageListener__) {
    window.removeEventListener("message", window.__flipbookMessageListener__);
  }

  const handleMessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      return;
    }

    if (typeof event.data === "string") {
      if (event.data.startsWith("{") && event.data.includes("Photopea")) return;

      if (event.data === "✅ done") {
        if (collectedFrames.length === 0) {
          alert("❌ No frames received.");
          return;
        }

        const imageDataURLs = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return "data:image/png;base64," + btoa(binary);
        });

        previewWindow?.postMessage({ type: "images", images: imageDataURLs }, "*");
        collectedFrames.length = 0;
      } else {
        console.log("[flipbook] Message:", event.data);
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
        var original = app.activeDocument;
        if (!original || original.layers.length === 0) {
          app.echoToOE("❌ No valid layers found.");
          return;
        }

        var animGroup = null;
        for (var i = 0; i < original.layers.length; i++) {
          var layer = original.layers[i];
          if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
            animGroup = layer;
            break;
          }
        }

        if (!animGroup) {
          app.echoToOE("❌ Folder 'anim_preview' not found.");
          return;
        }

        if (animGroup.layers.length === 0) {
          app.echoToOE("❌ 'anim_preview' folder is empty.");
          return;
        }

        // ✅ Send width and height before starting export
        var payload = {
          type: "canvasSize",
          width: original.width,
          height: original.height
        };
        app.sendToOE(JSON.stringify(payload));

        // 🔁 Export each frame to OE
        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);

        for (var i = animGroup.layers.length - 1; i >= 0; i--) {
          var frameLayer = animGroup.layers[i];
          if (frameLayer.name === "Background" && frameLayer.locked) continue;

          app.activeDocument = tempDoc;
          while (tempDoc.layers.length > 0) {
            try { tempDoc.layers[0].remove(); } catch (e) {}
          }

          app.activeDocument = original;
          animGroup.visible = true;
          frameLayer.visible = true;
          original.activeLayer = frameLayer;
          frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          app.activeDocument = tempDoc;
          app.refresh();
          tempDoc.saveToOE("png");
        }

        app.activeDocument = tempDoc;
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.echoToOE("✅ done");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Export script sent to Photopea");
  };
});
