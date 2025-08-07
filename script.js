document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  btn.onclick = () => {
    const script = `(function () {
      try {
        var original = app.activeDocument;
        if (!original) { app.echoToOE("❌ No active document"); return; }

        var animGroup = null;
        for (var i = 0; i < original.layers.length; i++) {
          var layer = original.layers[i];
          if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
            animGroup = layer;
            break;
          }
        }

        if (!animGroup || animGroup.layers.length < 2) {
          app.echoToOE("❌ Need at least 2 layers in 'anim_preview'");
          return;
        }

        // Create or reuse _temp_export
        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        app.echoToOE("📄 Created _temp_export");

        // We'll only export the last two layers
        for (var i = animGroup.layers.length - 2; i < animGroup.layers.length; i++) {
          var frameLayer = animGroup.layers[i];

          app.activeDocument = tempDoc;
          app.echoToOE("🧹 Clearing _temp_export layers");
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            try { tempDoc.layers[j].remove(); } catch (e) {}
          }

          app.refresh();

          app.activeDocument = original;
          animGroup.visible = true;

          // Hide all layers first
          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = false;
          }

          // Show only current layer
          frameLayer.visible = true;
          original.activeLayer = frameLayer;
          app.echoToOE("🔁 Preparing frame: " + frameLayer.name);
          app.refresh();

          // Duplicate to temp
          frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);
          app.echoToOE("✅ Duplicated frame: " + frameLayer.name);

          // Pause a moment
          app.refresh();
        }

        app.echoToOE("✅ done (temp left open)");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent export script to Photopea");
  };
});
