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

          // 1. Hide all layers in animGroup
          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = false;
          }

          // 2. Show only the current frame
          frameLayer.visible = true;
          animGroup.visible = true;
          app.refresh();

          // 3. Create a temp group, move this layer into it
          var tempGroup = animGroup.layerSets.add();
          tempGroup.name = "__temp_frame_group__";
          frameLayer.move(tempGroup, ElementPlacement.INSIDE);
          app.refresh();

          // 4. Duplicate the group into temp doc
          app.echoToOE("📤 Duplicating frame group: " + tempGroup.name);
          tempGroup.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          // 5. Move layer back out and delete temp group
          var movedLayer = tempGroup.layers[0];
          movedLayer.move(animGroup, ElementPlacement.PLACEATBEGINNING);
          tempGroup.remove();
          app.refresh();

          // 6. Confirm result
          app.activeDocument = tempDoc;
          app.refresh();
          app.echoToOE("✅ Frame duplicated. Temp doc now has: " + tempDoc.layers.length + " layers.");
        }

        app.echoToOE("🧪 Done duplicating 2 frames. Inspect _temp_export manually.");
        app.activeDocument = tempDoc;

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 🧪 Sent isolation-via-group script");
  };
});
