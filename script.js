document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return console.error("❌ Button #renameBtn not found");

  btn.onclick = () => {
    const script = `(function () {
      try {
        app.echoToOE("[flipbook] 🚀 Starting export without refresh");

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

        // Hide all layers initially
        for (var i = 0; i < animGroup.layers.length; i++) {
          animGroup.layers[i].visible = false;
        }

        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        app.activeDocument = tempDoc;

        var frameCount = Math.min(2, animGroup.layers.length);

        for (var i = 0; i < frameCount; i++) {
          var frame = animGroup.layers[i];

          // Show only this frame
          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = (j === i);
          }

          app.activeDocument = original;
          original.activeLayer = frame;
          app.runMenuItem(stringIDToTypeID("selectAll"));
          app.runMenuItem(stringIDToTypeID("copy"));

          app.activeDocument = tempDoc;

          // Clear previous layers
          while (tempDoc.layers.length > 0) {
            try { tempDoc.layers[0].remove(); } catch (e) {}
          }

          app.runMenuItem(stringIDToTypeID("paste"));
          tempDoc.saveToOE("png");

          app.echoToOE("[flipbook] ✅ Frame " + (i + 1) + " exported");
        }

        app.echoToOE("[flipbook] ✅ Export done");

      } catch (e) {
        app.echoToOE("❌ SCRIPT ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent safe export script (no refresh)");
  };
});
