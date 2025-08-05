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
          var demoGroup = null;

          // Step 1: Find the 'anim_preview' folder at root
          for (var i = 0; i < original.layerSets.length; i++) {
            if (original.layerSets[i].name === "anim_preview") {
              demoGroup = original.layerSets[i];
              break;
            }
          }

          if (!demoGroup) {
            alert("❌ Folder 'anim_preview' not found.");
            return;
          }

          if (!demoGroup.layers || demoGroup.layers.length === 0) {
            alert("❌ No layers inside 'anim_preview'.");
            return;
          }

          // Step 2: Create new empty document
          var newDoc = app.documents.add(
            original.width,
            original.height,
            original.resolution,
            "flat_anim_preview",
            NewDocumentMode.RGB
          );

          // Step 3: Copy each ArtLayer from anim_preview group into new doc at root
          for (var i = demoGroup.layers.length - 1; i >= 0; i--) {
            var layer = demoGroup.layers[i];

            if (layer.typename === "ArtLayer" && !layer.locked) {
              app.activeDocument = original;
              original.activeLayer = layer;

              layer.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);
            }
          }

          // Step 4: Switch to new doc
          app.activeDocument = newDoc;

          // Step 5: Find and fill the "Background" layer with white
          for (var i = 0; i < newDoc.artLayers.length; i++) {
            var lyr = newDoc.artLayers[i];
            if (lyr.name.toLowerCase() === "background" && lyr.kind === LayerKind.NORMAL) {
              newDoc.activeLayer = lyr;
              app.foregroundColor.rgb.red = 255;
              app.foregroundColor.rgb.green = 255;
              app.foregroundColor.rgb.blue = 255;
              newDoc.selection.selectAll();
              newDoc.selection.fill(app.foregroundColor);
              newDoc.selection.deselect();
              break;
            }
          }

          alert("✅ Layers from 'anim_preview' duplicated into 'flat_anim_preview' and background filled.");
        } catch (e) {
          alert("❌ Error: " + e.toString());
        }
      })();
    `;

    window.parent.postMessage(script, "*");
  };
});
