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

          // 🔻 Step 1: Hide all layers in anim_preview
          for (var h = 0; h < animGroup.layers.length; h++) {
            animGroup.layers[h].visible = false;
          }

          // 🔻 Step 2: Make only this frame visible
          frameLayer.visible = true;

          // 🔻 Step 3: Clean up temp doc
          app.activeDocument = tempDoc;
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            try {
              tempDoc.layers[j].remove();
            } catch (e) {}
          }
          app.refresh();

          // 🔻 Step 4: Duplicate frame to temp
          app.activeDocument = original;
          original.activeLayer = frameLayer;
          app.refresh();

          app.echoToOE("📤 Duplicating: " + frameLayer.name);
          frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          app.activeDocument = tempDoc;
          app.refresh();
          app.echoToOE("✅ Done: " + frameLayer.name + ". Temp doc now has " + tempDoc.layers.length + " layer(s).");
        }

        app.activeDocument = tempDoc;
        app.echoToOE("🧪 Final state ready. Inspect _temp_export manually.");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 🔄 Sent improved test with visibility isolation");
  };
});
