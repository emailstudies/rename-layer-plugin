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
          if (app.documents.length === 0) throw "❌ No open document.";

          var doc = app.activeDocument;
          var demoGroup = null;

          // Find 'demo' folder at root
          for (var i = 0; i < doc.layerSets.length; i++) {
            if (doc.layerSets[i].name === "demo") {
              demoGroup = doc.layerSets[i];
              break;
            }
          }

          if (!demoGroup) throw "❌ Folder 'demo' not found.";

          var layers = demoGroup.artLayers;
          if (layers.length === 0) throw "❌ No layers inside 'demo'.";

          // Create new document
          var newDoc = app.documents.add(
            doc.width,
            doc.height,
            doc.resolution,
            "demo_layers",
            doc.mode
          );

          // Copy each layer from bottom to top
          for (var j = layers.length - 1; j >= 0; j--) {
            layers[j].duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);
          }

          app.activeDocument = newDoc;
          app.echoToOE("✅ New document created with layers from 'demo'.");
        } catch (err) {
          app.echoToOE("❌ Error: " + err.toString());
        }
      })();
    `;

    window.parent.postMessage(script, "*");
  };
});
