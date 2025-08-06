document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return;

  const collectedFrames = [];
  let previewWindow = null;

  btn.onclick = () => {
    previewWindow = window.open("preview.html", "_blank");
    collectedFrames.length = 0;

    const script = `
      (function () {
        try {
          var original = app.activeDocument;
          if (!original || original.layers.length === 0) {
            app.echoToOE("❌ No valid document.");
            return;
          }

          var animGroup = null;
          for (var i = 0; i < original.layers.length; i++) {
            if (original.layers[i].typename === "LayerSet" && original.layers[i].name === "anim_preview") {
              animGroup = original.layers[i];
              break;
            }
          }

          if (!animGroup || animGroup.layers.length === 0) {
            app.echoToOE("❌ 'anim_preview' folder missing or empty.");
            return;
          }

          app.echoToOE("🔧 Exporting " + animGroup.layers.length + " frame(s)...");

          var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
          app.activeDocument = tempDoc;

          // Delete default layers
          for (var k = tempDoc.layers.length - 1; k >= 0; k--) {
            try { tempDoc.layers[k].remove(); } catch (e) {}
          }

          for (var i = animGroup.layers.length - 1; i >= 0; i--) {
            var frameLayer = animGroup.layers[i];

            // Hide all layers
            for (var j = 0; j < animGroup.layers.length; j++) {
              animGroup.layers[j].visible = false;
            }

            frameLayer.visible = true;
            original.activeLayer = frameLayer;

            app.echoToOE("📤 Exporting: " + frameLayer.name);

            // Clean temp doc
            app.activeDocument = tempDoc;
            for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
              try { tempDoc.layers[j].remove(); } catch (e) {}
            }

            // Duplicate frame
            app.activeDocument = original;
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
      })();
    `;

    parent.postMessage(script, "*");
    console.log("📤 Sent export script to Photopea");
  };

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

        const imageDataURLs = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return "data:image/png;base64," + btoa(binary);
        });

        const sendImages = () => {
          try {
            previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
          } catch (err) {
            console.error("❌ Failed to send frames:", err);
          }
        };

        if (previewWindow.document && previewWindow.document.readyState === "complete") {
          sendImages();
        } else {
          previewWindow.onload = sendImages;
        }
      }
    }
  });
});
