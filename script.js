document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #copyDemoBtn not found");
    return;
  }

  btn.onclick = () => {
    const script = `
      (function () {
        try {
          var doc = app.activeDocument;
          var demoGroup = null;

          // Find 'demo' LayerSet at root
          for (var i = 0; i < doc.layerSets.length; i++) {
            if (doc.layerSets[i].name === "demo") {
              demoGroup = doc.layerSets[i];
              break;
            }
          }

          if (!demoGroup) throw "❌ Folder 'demo' not found.";
          if (!demoGroup.layers || demoGroup.layers.length === 0) {
            throw "❌ 'demo' has no layers.";
          }

          // Create a new empty document
          var newDoc = app.documents.add(
            doc.width,
            doc.height,
            doc.resolution,
            "demo_flat",
            NewDocumentMode.RGB
          );

          // Duplicate each child layer (but skip nested groups)
          for (var i = demoGroup.layers.length - 1; i >= 0; i--) {
            var layer = demoGroup.layers[i];

            // Skip nested folders
            if (layer.typename === "ArtLayer") {
              if (!layer.locked) {
                layer.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);
              }
            }
          }

          app.activeDocument = newDoc;
          app.echoToOE("✅ Layers from 'demo' duplicated to new doc at root.");
        } catch (e) {
          app.echoToOE("❌ Error: " + e.toString());
        }
      })();
    `;

    window.parent.postMessage(script, "*");
  };
});
