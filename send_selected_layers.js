window.addEventListener("message", (event) => {
  if (event.data !== "EXPORT_SELECTED_ANIM_FRAMES") return;

  const script = `
    (function () {
      try {
        var original = app.activeDocument;
        var sel = original.activeLayer;

        if (!sel || sel.typename !== "LayerSet" || !sel.name.startsWith("anim_")) {
          app.echoToOE("❌ Please select an 'anim_*' folder.");
          return;
        }

        var temp = app.documents.add(
          original.width,
          original.height,
          original.resolution,
          "_temp_export",
          NewDocumentMode.RGB
        );

        for (var i = sel.layers.length - 1; i >= 0; i--) {
          var layer = sel.layers[i];
          if (layer.kind !== undefined && !layer.locked) {
            app.activeDocument = temp;
            while (temp.layers.length > 0) temp.layers[0].remove();

            app.activeDocument = original;
            original.activeLayer = layer;
            layer.duplicate(temp, ElementPlacement.PLACEATBEGINNING);

            app.activeDocument = temp;
            var png = temp.saveToOE("png");
            app.sendToOE(png); // ✅ THIS LINE makes it work
          }
        }

        app.activeDocument = temp;
        temp.close(SaveOptions.DONOTSAVECHANGES);
        app.echoToOE("✅ PNGs exported");
      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message); // ✅ FIXED!
      }
    })();
  `;

  parent.postMessage(script, "*");
  console.log("📤 Export script sent to Photopea");
});
