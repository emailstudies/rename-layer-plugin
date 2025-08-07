document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return alert("❌ No #renameBtn found");

  const collectedFrames = [];
  let imageDataURLs = [];
  let previewWindow = null;

  if (window.__flipbookMessageListener__) {
    window.removeEventListener("message", window.__flipbookMessageListener__);
  }

  const handleMessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      if (previewWindow) {
        previewWindow.postMessage("✅ next", "*");
      }
      return;
    }

    if (event.data === "✅ done") {
      console.log("[flipbook] ✅ All frames received.");
      imageDataURLs = collectedFrames.map((ab) => {
        const binary = String.fromCharCode(...new Uint8Array(ab));
        return "data:image/png;base64," + btoa(binary);
      });

      if (previewWindow) {
        previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
      }

      collectedFrames.length = 0;
    }
  };

  window.addEventListener("message", handleMessage);
  window.__flipbookMessageListener__ = handleMessage;

  btn.onclick = () => {
    previewWindow = window.open("preview.html");
    if (!previewWindow) return alert("❌ Please allow popups");

    collectedFrames.length = 0;

    const script = `
      (function () {
        try {
          var doc = app.activeDocument;
          if (!doc || doc.layers.length === 0) {
            app.echoToOE("❌ No layers to export");
            return;
          }

          var tempDoc = app.documents.add(doc.width, doc.height, doc.resolution, "_temp", NewDocumentMode.RGB);
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            try { tempDoc.layers[j].remove(); } catch (e) {}
          }

          var layers = doc.layers;
          var frameIndex = 0;

          function exportFrame(index) {
            if (index >= layers.length) {
              app.echoToOE("✅ done");
              return;
            }

            for (var k = 0; k < layers.length; k++) {
              layers[k].visible = false;
            }

            var current = layers[index];
            current.visible = true;
            doc.activeLayer = current;

            var dup = current.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);
            app.activeDocument = tempDoc;
            app.refresh();
            tempDoc.saveToOE("png");

            app.echoToOE("📸 Sent frame " + index);
            frameIndex = index + 1;
          }

          window.__frameAckListener__ = function (event) {
            if (event.data === "✅ next") {
              exportFrame(frameIndex);
            }
          };

          window.addEventListener("message", window.__frameAckListener__);
          exportFrame(0);
        } catch (e) {
          app.echoToOE("❌ ERROR: " + e.message);
        }
      })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent coordinated export script");
  };
});
