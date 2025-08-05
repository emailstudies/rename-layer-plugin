document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtm");

  if (!btn) {
    console.error("❌ Button #copyDemoBtn not found");
    return;
  }

  btn.onclick = () => {
    const script = `
      (function () {
        try {
          var original = app.activeDocument;
          var previewGroup = null;

          // Step 1: Find 'anim_preview' folder
          for (var i = 0; i < original.layerSets.length; i++) {
            if (original.layerSets[i].name === "anim_preview") {
              previewGroup = original.layerSets[i];
              break;
            }
          }

          if (!previewGroup) throw "❌ Folder 'anim_preview' not found.";
          if (!previewGroup.layers || previewGroup.layers.length === 0) {
            throw "❌ No layers inside 'anim_preview'.";
          }

          // Step 2: Create new document
          var newDoc = app.documents.add(
            original.width,
            original.height,
            original.resolution,
            "flat_anim_preview",
            NewDocumentMode.RGB
          );

          // Step 3: Add white background layer
          app.activeDocument = newDoc;
          var bg = newDoc.artLayers.add();
          bg.name = "Background";
          bg.move(newDoc, ElementPlacement.PLACEATEND);
          app.foregroundColor.rgb.red = 255;
          app.foregroundColor.rgb.green = 255;
          app.foregroundColor.rgb.blue = 255;
          newDoc.selection.selectAll();
          newDoc.selection.fill(app.foregroundColor);
          newDoc.selection.deselect();

          // Step 4: Copy each ArtLayer from anim_preview into new doc
          for (var i = previewGroup.layers.length - 1; i >= 0; i--) {
            var layer = previewGroup.layers[i];

            if (layer.typename === "ArtLayer" && !layer.locked) {
              app.activeDocument = original;
              original.activeLayer = layer;

              layer.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);
            }
          }

          // Step 5: Switch to new doc
          app.activeDocument = newDoc;
          app.echoToOE("✅ Layers from 'anim_preview' copied to 'flat_anim_preview' with white background.");
        } catch (e) {
          app.echoToOE("❌ Error: " + e.toString());
        }
      })();
    `;

    window.parent.postMessage(script, "*");
  };
});
