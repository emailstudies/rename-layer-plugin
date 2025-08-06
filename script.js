// flipbook_export.js (Plugin-side — fixed order, safe export)
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
          app.echoToOE("❌ No valid layers found.");
          return;
        }

        var animFolder = null;
        for (var i = 0; i < original.layers.length; i++) {
          if (original.layers[i].name === "anim_preview" && original.layers[i].typename === "LayerSet") {
            animFolder = original.layers[i];
            break;
          }
        }

        if (!animFolder) {
          alert("❌ 'anim_preview' folder not found.");
          return;
        }

        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);

        for (var i = 0; i < animFolder.layers.length; i++) {
          var layer = animFolder.layers[i];

          if (layer.name === "Background" && layer.locked) continue;

          app.activeDocument = original;
          var dup = layer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          app.activeDocument = tempDoc;
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            if (tempDoc.layers[j] !== dup) {
              try { tempDoc.layers[j].remove(); } catch (e) {}
            }
          }

          app.refresh();
          app.echoToOE("📸 Exporting frame: " + layer.name);
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
    console.log("📤 Sent export script to Photopea");
  };

  const collectedFrames = [];

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      if (event.data === "✅ done") {
        console.log(`✅ All frames received: ${collectedFrames.length}`);
        if (collectedFrames.length === 0) {
          console.log("❌ No frames received.");
          return;
        }

        const framesBase64 = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return btoa(binary);
        });

        const previewWindow = window.open("preview.html");
        previewWindow.onload = () => {
          previewWindow.postMessage({ type: "images", images: framesBase64 }, "*");
        };

        collectedFrames.length = 0;
      } else if (event.data.startsWith("❌")) {
        console.log("⚠️ Photopea reported:", event.data);
      }
    }
  });
});
