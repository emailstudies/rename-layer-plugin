document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }  

  btn.onclick = () => {
    const script = `(function () {
      try {
        var original = app.activeDocument;
        if (!original || original.layers.length === 0) {
          alert("❌ No valid layers found.");
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
          alert("❌ Folder 'anim_preview' not found.");
          return;
        }

        if (animGroup.layers.length === 0) {
          alert("❌ 'anim_preview' folder is empty.");
          return;
        }

        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);

        for (var i = animGroup.layers.length - 1; i >= 0; i--) {
          var frameLayer = animGroup.layers[i];
          if (frameLayer.name === "Background" && frameLayer.locked) continue;

          app.activeDocument = tempDoc;
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            try { tempDoc.layers[j].remove(); } catch (e) {}
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
    console.log("[flipbook] 📤 Sent export script to Photopea");
  };

  const collectedFrames = [];
  let imageDataURLs = [];
  let previewWindow = null;

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      console.log("[flipbook] 📩 Message from Photopea:", event.data);

      if (event.data === "✅ done") {
        if (collectedFrames.length === 0) {
          alert("❌ No frames received.");
          return;
        }

        imageDataURLs = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return "data:image/png;base64," + btoa(binary);
        });

        previewWindow = window.open("preview.html");

        previewWindow.onload = () => {
          previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
        };

        collectedFrames.length = 0;
      } else if (event.data.startsWith("❌")) {
        console.log("[flipbook] ⚠️ Error:", event.data);
      }
    }
  });
});
