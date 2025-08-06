// flipbook_export.js (Plugin-side)
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

        if (animFolder.layers.length === 0) {
          alert("❌ 'anim_preview' has no layers.");
          return;
        }

        var lastIndex = animFolder.layers.length - 1;
        var lastLayer = animFolder.layers[lastIndex];
        if (!lastLayer) {
          alert("❌ Last frame not found.");
          return;
        }

        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);

        // Clear default background from tempDoc
        app.activeDocument = tempDoc;
        for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
          try { tempDoc.layers[j].remove(); } catch (e) {}
        }

        // Duplicate last layer into tempDoc
        app.activeDocument = original;
        var wasVisible = lastLayer.visible;
        lastLayer.visible = true;
        var dup = lastLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);
        lastLayer.visible = wasVisible;

        // Export PNG
        app.activeDocument = tempDoc;
        app.refresh();
        app.echoToOE("📸 Exported ONLY last frame: " + lastLayer.name);
        tempDoc.saveToOE("png");

        // Cleanup
        app.activeDocument = tempDoc;
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.activeDocument = original;
        app.echoToOE("✅ done");
      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("📤 Sent last-frame export script to Photopea");
  };

  const collectedFrames = [];

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      if (event.data === "✅ done") {
        if (collectedFrames.length === 0) {
          console.log("❌ No frame received.");
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
      } else if (event.data.startsWith("📸")) {
        console.log(event.data);
      }
    }
  });
});
