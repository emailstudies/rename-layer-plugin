window.addEventListener("message", (event) => {
  if (event.data !== "EXPORT_SELECTED_ANIM_FRAMES") return;

  const script = `
    (function () {
      try {
        var doc = app.activeDocument;
        var selected = doc.activeLayer;

        if (!selected || selected.typename !== "LayerSet" || !selected.name.startsWith("anim_")) {
          app.echoToOE("[plugin] ❌ Please select a top-level 'anim_*' folder.");
          return;
        }

        var temp = app.documents.add(
          doc.width,
          doc.height,
          doc.resolution,
          "_temp_export",
          NewDocumentMode.RGB
        );

        for (var i = selected.layers.length - 1; i >= 0; i--) {
          var layer = selected.layers[i];
          if (layer.kind !== undefined && !layer.locked) {
            // Clear previous layers
            app.activeDocument = temp;
            while (temp.layers.length > 0) temp.layers[0].remove();

            // Copy frame
            app.activeDocument = doc;
            doc.activeLayer = layer;
            layer.duplicate(temp, ElementPlacement.PLACEATBEGINNING);

            // Send PNG
            app.activeDocument = temp;
            var png = temp.saveToOE("png");
            app.sendToOE(png);
          }
        }

        // Cleanup
        app.activeDocument = temp;
        temp.close(SaveOptions.DONOTSAVECHANGES);
        app.echoToOE("[plugin] ✅ PNGs exported");
      } catch (e) {
        app.echoToOE("[plugin] ❌ ERROR: " + e.message);
      }
    })();
  `;

  parent.postMessage(script, "*");
  console.log("📤 Export script sent to Photopea");
});
