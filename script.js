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
          // Step 1: Select the "demo" group
          var idslct = charIDToTypeID("slct");
          var desc = new ActionDescriptor();
          var ref = new ActionReference();
          ref.putName(charIDToTypeID("Lyr "), "demo");
          desc.putReference(charIDToTypeID("null"), ref);
          desc.putBoolean(charIDToTypeID("MkVs"), false);
          executeAction(idslct, desc, DialogModes.NO);

          // Step 2: Expand the group
          executeAction(stringIDToTypeID("expandLayer"), undefined, DialogModes.NO);

          // Step 3: Get the active group and its layers
          var demoGroup = app.activeDocument.activeLayer;
          if (!demoGroup || !demoGroup.layers || demoGroup.layers.length === 0) {
            throw "❌ No layers found inside 'demo'.";
          }

          // Step 4: Create a new document
          var doc = app.activeDocument;
          var newDoc = app.documents.add(
            doc.width,
            doc.height,
            doc.resolution,
            "demo_layers",
            NewDocumentMode.RGB
          );

          // Step 5: Duplicate each layer from demo into the new doc
          for (var i = demoGroup.layers.length - 1; i >= 0; i--) {
            app.activeDocument = doc;

            // Select by index
            var selDesc = new ActionDescriptor();
            var selRef = new ActionReference();
            selRef.putIndex(charIDToTypeID("Lyr "), demoGroup.layers[i].itemIndex);
            selDesc.putReference(charIDToTypeID("null"), selRef);
            executeAction(charIDToTypeID("slct"), selDesc, DialogModes.NO);

            // Duplicate to new document
            var dupDesc = new ActionDescriptor();
            var dupRef = new ActionReference();
            dupRef.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
            dupDesc.putReference(charIDToTypeID("T   "), dupRef);
            executeAction(charIDToTypeID("Dplc"), dupDesc, DialogModes.NO);
          }

          // Step 6: Switch to new document
          app.activeDocument = newDoc;
          app.echoToOE("✅ Layers from 'demo' duplicated into new document.");
        } catch (e) {
          app.echoToOE("❌ Error: " + e.toString());
        }
      })();
    `;

    window.parent.postMessage(script, "*");
  };
});
