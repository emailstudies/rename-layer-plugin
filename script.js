document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return console.error("❌ Button #renameBtn not found");

  btn.onclick = () => {
    const script = `(function () {
      try {
        app.echoToOE("[flipbook] 🚀 Starting COPY-based export");

        var original = app.activeDocument;
        if (!original || original.layers.length === 0) {
          app.echoToOE("❌ No valid doc or layers.");
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
          app.echoToOE("❌ 'anim_preview' not found or empty.");
          return;
        }

        // Hide all frames first
        for (var i = 0; i < animGroup.layers.length; i++) {
          animGroup.layers[i].visible = false;
        }

        // Create temp doc
        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        app.activeDocument = tempDoc;
        app.refresh();
        app.echoToOE("[flipbook] ✅ Created _temp_export");

        // Export 2 frames
        var frameCount = Math.min(2, animGroup.layers.length);

        for (var i = 0; i < frameCount; i++) {
          var frame = animGroup.layers[i];

          // Show only this frame
          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = (j === i);
          }

          app.activeDocument = original;
          original.activeLayer = frame;
          app.refresh();

          try {
            // Select and copy
            app.runMenuItem(stringIDToTypeID("selectAll"));
            app.runMenuItem(stringIDToTypeID("copy"));

            // Paste into temp
            app.activeDocument = tempDoc;
            for (var k = tempDoc.layers.length - 1; k >= 0; k--) {
              try { tempDoc.layers[k].remove(); } catch (e) {}
            }
            app.runMenuItem(stringIDToTypeID("paste"));
            app.refresh();

            tempDoc.saveToOE("png");
            app.echoToOE("[flipbook] ✅ Frame " + (i + 1) + " exported");

          } catch (err) {
            app.echoToOE("❌ Copy/paste failed at frame " + (i + 1) + ": " + err.message);
          }
        }

        app.echoToOE("[flipbook] 🎉 Done (temp open)");
      } catch (e) {
        app.echoToOE("❌ SCRIPT ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent copy/paste export script");
  };
});
