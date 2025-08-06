// flipbook_export.js (Plugin-side with sync per-frame export)
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  let frameLayers = [];
  let frameIndex = 0;
  let collectedFrames = [];

  function sendNextFrame() {
    const script = `(function () {
      try {
        var original = app.activeDocument;
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

        if (!app._tempExportDoc) {
          app._tempExportDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        }

        var tempDoc = app._tempExportDoc;
        var layers = animFolder.layers;
        var layer = layers[${frameIndex}];

        if (!layer) {
          app.activeDocument = tempDoc;
          tempDoc.close(SaveOptions.DONOTSAVECHANGES);
          delete app._tempExportDoc;
          app.echoToOE("✅ done");
          return;
        }

        if (layer.name === "Background" && layer.locked) {
          app.echoToOE("[next_frame]");
          return;
        }

        app.activeDocument = tempDoc;
        for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
          try { tempDoc.layers[j].remove(); } catch (e) {}
        }

        app.activeDocument = original;
        var dup = layer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

        app.activeDocument = tempDoc;
        app.refresh();
        tempDoc.saveToOE("png");
        app.echoToOE("[next_frame]");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
  }

  btn.onclick = () => {
    frameIndex = 0;
    collectedFrames = [];
    sendNextFrame();
  };

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      if (event.data === "[next_frame]") {
        frameIndex++;
        sendNextFrame();

      } else if (event.data === "✅ done") {
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
