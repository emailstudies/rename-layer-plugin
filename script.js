document.addEventListener("DOMContentLoaded", () => {
  const renameBtn = document.getElementById("renameBtn");
  const previewWindow = window.open("preview.html");

  if (!renameBtn || !previewWindow) {
    console.error("❌ Button or preview window missing.");
    return;
  }

  const collectedFrames = [];

  window.addEventListener("message", (event) => {
    if (typeof event.data === "string" && event.data === "done") {
      console.log("[flipbook] ✅ All frames received.");
      previewWindow.postMessage({ type: "frames", images: collectedFrames }, "*");
    } else if (event.data instanceof ArrayBuffer) {
      const blob = new Blob([event.data], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      collectedFrames.push(url);
    }
  });

  renameBtn.onclick = () => {
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

        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

        for (var i = animGroup.layers.length - 1; i >= 0; i--) {
          var frameLayer = animGroup.layers[i];
          if (frameLayer.name === "Background" && frameLayer.locked) continue;

          app.activeDocument = tempDoc;
          while (tempDoc.layers.length > 0) {
            try { tempDoc.layers[0].remove(); } catch (e) {}
          }

          app.activeDocument = original;

          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = false;
          }

          frameLayer.visible = true;
          animGroup.visible = true;
          original.activeLayer = frameLayer;

          frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          app.activeDocument = tempDoc;
          app.refresh();
          tempDoc.saveToOE("png");
        }

        app.activeDocument = tempDoc;
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.echoToOE("done");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent export script to Photopea");
  };
});
