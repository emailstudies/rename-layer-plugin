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

          // Step 2: Try to find background color in original doc
          var bgColor = { r: 255, g: 255, b: 255 }; // default white
          for (var i = 0; i < original.artLayers.length; i++) {
            var lyr = original.artLayers[i];
            if (lyr.name.toLowerCase() === "background" && lyr.kind === LayerKind.NORMAL) {
              app.activeDocument = original;
              original.activeLayer = lyr;
              // Set the sampled color as foreground (if solid)
              // We assume it's white unless user explicitly changes fill later
              break;
            }
          }

          // Step 3: Create new document
          var newDoc = app.documents.add(
            original.width,
            original.height,
            original.resolution,
            "flat_anim_preview",
            NewDocumentMode.RGB
          );

          // Step 4: Fill new doc's background with sampled color (or white)
          app.activeDocument = newDoc;
          var bg = newDoc.artLayers.add();
          bg.name = "Background";
          bg.move(newDoc, ElementPlacement.PLACEATEND);

          // Try to reuse original's foreground color if changed
          app.foregroundColor.rgb.red = bgColor.r;
          app.foregroundColor.rgb.green = bgColor.g;
          app.foregroundColor.rgb.blue = bgColor.b;

          newDoc.selection.selectAll();
          newDoc.selection.fill(app.foregroundColor);
          newDoc.selection.deselect();

          // Step 5: Copy each ArtLayer from anim_preview group
          for (var i = previewGroup.layers.length - 1; i >= 0; i--) {
            var layer = previewGroup.layers[i];

            if (layer.typename === "ArtLayer" && !layer.locked) {
              app.activeDocument = original;
              original.activeLayer = layer;

              layer.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);
            }
          }

          app.activeDocument = newDoc;
          alert("✅ Layers from 'anim_preview' copied with background to 'flat_anim_preview'.");
        } catch (e) {
          alert("❌ Error: " + e.toString());
        }
      })();
    `;

    window.parent.postMessage(script, "*");
  };
});
