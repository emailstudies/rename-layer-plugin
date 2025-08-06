document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  const collectedFrames = [];
  let imageDataURLs = [];
  let previewWindow = null;

  btn.onclick = () => {
    const script = `(function () {
      try {
        var original = app.activeDocument;
        if (!original || original.layers.length === 0) {
          app.echoToOE("❌ No valid layers found.");
          return;
        }

        app.echoToOE("[flipbook] 📄 Document: " + original.name);

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

        // ✅ Gather only ArtLayer frames
        var frameLayers = [];
        for (var i = 0; i < animGroup.layers.length; i++) {
          var sub = animGroup.layers[i];
          if (sub.typename === "ArtLayer") {
            frameLayers.push(sub);
            app.echoToOE("[flipbook] 🧩 Frame added: " + sub.name);
          } else {
            app.echoToOE("[flipbook] ⚠️ Skipped non-ArtLayer: " + sub.name);
          }
        }

        if (frameLayers.length === 0) {
          app.echoToOE("❌ No valid frame layers in 'anim_preview'");
          return;
        }

        app.echoToOE("[flipbook] ✅ Total valid frames: " + frameLayers.length);

        // Create export doc
        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        app.activeDocument = tempDoc;

        // Remove default layers
        for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
          try { tempDoc.layers[j].remove(); } catch (e) {}
        }

        for (var i = 0; i < frameLayers.length; i++) {
          var frameLayer = frameLayers[i];

          // Clean temp
          app.activeDocument = tempDoc;
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            try { tempDoc.layers[j].remove(); } catch (e) {}
          }

          app.activeDocument = original;

          // Hide all layers in animGroup except current
          for (var k = 0; k < animGroup.layers.length; k++) {
            animGroup.layers[k].visible = (animGroup.layers[k] === frameLayer);
          }

          app.echoToOE("[flipbook] 📸 Exporting frame " + (i + 1) + ": " + frameLayer.name);
          frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          app.activeDocument = tempDoc;
          app.refresh();
          tempDoc.saveToOE("png");

          app.echoToOE("[flipbook] ✅ Frame exported: " + frameLayer.name);
        }

        app.activeDocument = tempDoc;
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.echoToOE("✅ done");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent tempDoc export script to Photopea");
  };

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      const msg = event.data;
      console.log("[flipbook] 📩 Message from Photopea:", msg);

      if (msg === "✅ done") {
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
      } else if (msg.startsWith("❌")) {
        console.error("[flipbook] ⚠️ Error from Photopea:", msg);
      } else {
        console.log("[flipbook] ℹ️", msg);
      }
    }
  });
});
