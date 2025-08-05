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
          var original = app.activeDocument;
          var demoGroup = null;

          // Step 1: Find the 'demo' folder at root
          for (var i = 0; i < original.layerSets.length; i++) {
            if (original.layerSets[i].name === "demo") {
              demoGroup = original.layerSets[i];
              break;
            }
          }

          if (!demoGroup) throw "❌ Folder 'demo' not found.";
          if (!demoGroup.layers || demoGroup.layers.length === 0) {
            throw "❌ No layers inside 'demo'.";
          }

          // Step 2: Create new empty document
          var newDoc = app.documents.add(
            original.width,
            original.height,
            original.resolution,
            "demo_flat",
            NewDocumentMode.RGB
          );

          // Step 3: Copy each ArtLayer from demo group into new doc at root
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
          app.echoToOE("✅ Layers from 'demo' duplicated into new document at root.");
        } catch (e) {
          app.echoToOE("❌ Error: " + e.toString());
        }
      })();
    `;

    window.parent.postMessage(script, "*");
  };
});
