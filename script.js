document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #renameBtn not found");
    return;
  }

  btn.onclick = () => {
    const script = `(function () {
      try {
        var original = app.activeDocument;
        if (!original || original.layers.length === 0) {
          app.echoToOE("❌ No document or layers.");
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

        if (!animGroup || animGroup.layers.length < 2) {
          app.echoToOE("❌ 'anim_preview' folder not found or has fewer than 2 layers.");
          return;
        }

        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        app.echoToOE("✅ Temp doc created. Now processing 2 layers...");

        for (var i = animGroup.layers.length - 1; i >= animGroup.layers.length - 2; i--) {
          var frameLayer = animGroup.layers[i];

          // Hide all layers
          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = false;
          }

          // Show only current
          frameLayer.visible = true;
          animGroup.visible = true;
          app.refresh();

          // Duplicate frame layer to top-level
          var tempLayer = frameLayer.duplicate(original, ElementPlacement.PLACEATBEGINNING);

          // Wrap duplicate in a new top-level group
          var tempGroup = original.layerSets.add();
          tempGroup.name = "__temp_frame_group__";
          tempLayer.move(tempGroup, ElementPlacement.INSIDE);
          app.refresh();

          // Duplicate group into tempDoc
          tempGroup.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          // Cleanup: remove group from original
          tempGroup.remove();
          app.refresh();

          // Log and switch to temp
          app.activeDocument = tempDoc;
          app.refresh();
          app.echoToOE("✅ Duplicated: " + frameLayer.name + " | Temp doc now has: " + tempDoc.layers.length + " layers.");
        }

        app.echoToOE("🧪 Finished duplicating 2 frames. Inspect _temp_export manually.");
        app.activeDocument = tempDoc;

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 🧪 Sent corrected group-isolation script");
  };
});
