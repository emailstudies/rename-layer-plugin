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

          // Find the 'demo' folder at root level
          for (var i = 0; i < doc.layerSets.length; i++) {
            if (doc.layerSets[i].name === "demo") {
              demoGroup = doc.layerSets[i];
              break;
            }
          }

          if (!demoGroup) throw "❌ Folder 'demo' not found.";
          if (!demoGroup.layers || demoGroup.layers.length === 0) {
            throw "❌ No layers inside 'demo'.";
          }

          // Create a new blank document
          var newDoc = app.documents.add(
            doc.width,
            doc.height,
            doc.resolution,
            "demo_layers_flat",
            NewDocumentMode.RGB
          );

          // Duplicate each child layer of 'demo' directly to newDoc root
          for (var i = demoGroup.layers.length - 1; i >= 0; i--) {
            var layer = demoGroup.layers[i];
            layer.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);
          }

          app.activeDocument = newDoc;
          app.echoToOE("✅ Layers from 'demo' copied to new document at root.");
        } catch (e) {
          app.echoToOE("❌ Error: " + e.toString());
        }
      })();
    `;

    window.parent.postMessage(script, "*");
  };
});
