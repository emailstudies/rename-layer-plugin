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

        if (!animGroup || animGroup.layers.length === 0) {
          alert("❌ 'anim_preview' folder missing or empty.");
          return;
        }

        app.echoToOE("🔧 Exporting " + animGroup.layers.length + " frame(s)...");

        // Create temp doc with transparency
        var desc = new ActionDescriptor();
        desc.putUnitDouble(charIDToTypeID("Wdth"), charIDToTypeID("#Pxl"), original.width);
        desc.putUnitDouble(charIDToTypeID("Hght"), charIDToTypeID("#Pxl"), original.height);
        desc.putUnitDouble(charIDToTypeID("Rslt"), charIDToTypeID("#Rsl"), original.resolution);
        desc.putClass(charIDToTypeID("Md  "), charIDToTypeID("RGBM"));
        desc.putBoolean(stringIDToTypeID("fillTransparent"), true);
        desc.putString(charIDToTypeID("Nm  "), "_temp_export");
        executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
        var tempDoc = app.activeDocument;

        for (var i = animGroup.layers.length - 1; i >= 0; i--) {
          var frameLayer = animGroup.layers[i];
          if (frameLayer.name === "Background" && frameLayer.locked) continue;

          app.echoToOE("🎞️ Frame " + (animGroup.layers.length - i) + ": " + frameLayer.name);

          // Hide all layers first
          for (var k = 0; k < animGroup.layers.length; k++) {
            animGroup.layers[k].visible = false;
          }
          frameLayer.visible = true;
          original.activeLayer = frameLayer;

          app.echoToOE("👁️ Showing only: " + frameLayer.name);

          // Clear temp doc
          app.activeDocument = tempDoc;
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            try { tempDoc.layers[j].remove(); } catch (e) {}
          }
          app.echoToOE("🧹 Cleared temp doc");

          // Duplicate frame into temp doc
          app.activeDocument = original;
          frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);
          app.echoToOE("📋 Duplicated: " + frameLayer.name);

          // Export
          app.activeDocument = tempDoc;
          app.refresh();
          tempDoc.saveToOE("png");
          app.echoToOE("💾 Exported PNG for: " + frameLayer.name);
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
      console.log("[flipbook] 📩 Message from Photopea:\n", event.data);

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
        if (!previewWindow) {
          alert("❌ Could not open preview window. Please allow popups.");
          return;
        }

        const sendImages = () => {
          try {
            previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
          } catch (err) {
            console.error("❌ Failed to send frames:", err);
          }
        };

        if (previewWindow.document?.readyState === "complete") {
          sendImages();
        } else {
          previewWindow.onload = sendImages;
        }

        collectedFrames.length = 0;
      } else if (event.data.startsWith("❌")) {
        console.log("[flipbook] ⚠️ Error:", event.data);
      }
    }
  });
});
