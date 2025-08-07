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

          // 1. Ensure only this frameLayer is visible
          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = false;
          }
          frameLayer.visible = true;
          animGroup.visible = true;
          app.refresh();

          // Log visibility state
          app.echoToOE("👁️ Only visible: " + frameLayer.name);

          // 2. Clean up temp doc layers
          app.activeDocument = tempDoc;
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            try {
              tempDoc.layers[j].remove();
            } catch (e) {}
          }
          app.refresh();

          // 3. Switch back, set active layer, duplicate
          app.activeDocument = original;
          original.activeLayer = frameLayer;

          app.echoToOE("📤 Duplicating layer: " + frameLayer.name);
          app.refresh();
          frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          // 4. Confirm in temp doc
          app.activeDocument = tempDoc;
          app.refresh();
          app.echoToOE("✅ Frame " + frameLayer.name + " duplicated. Temp doc now has: " + tempDoc.layers.length + " layers.");
        }

        app.echoToOE("🧪 Done duplicating 2 frames. Inspect _temp_export manually.");
        app.activeDocument = tempDoc;

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 🧪 Sent test script with visibility isolation");
  };
});
