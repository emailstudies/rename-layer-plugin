document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #renameBtn not found");
    return;
  }

  btn.onclick = () => {
    const script = `
      (function () {
        try {
          var original = app.activeDocument;
          var previewGroup = null;

          // Step 1: Find the 'anim_preview' folder
          for (var i = 0; i < original.layerSets.length; i++) {
            if (original.layerSets[i].name === "anim_preview") {
              previewGroup = original.layerSets[i];
              break;
            }
          }

          if (!previewGroup) {
            alert("❌ Folder 'anim_preview' not found.");
            return;
          }

          if (!previewGroup.layers || previewGroup.layers.length === 0) {
            alert("❌ No layers inside 'anim_preview'.");
            return;
          }

          // Step 2: Create new document
          var newDoc = app.documents.add(
            original.width,
            original.height,
            original.resolution,
            "flat_anim_preview",
            NewDocumentMode.RGB
          );

          // Step 3: Add white background layer safely
          app.activeDocument = newDoc;
          var bg = newDoc.artLayers.add();
          bg.name = "Background";
          bg.move(newDoc, ElementPlacement.PLACEATEND);

          // Default to white
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

              // Duplicates without changing or removing from original
              layer.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);
            }
          }

          // Step 5: Return to new doc
          app.activeDocument = newDoc;
          alert("✅ Copied layers from 'anim_preview' to 'flat_anim_preview' with white background.");
        } catch (e) {
          alert("❌ Error: " + e.toString());
        }
      })();
    `;

    window.parent.postMessage(script, "*");
  };
});
