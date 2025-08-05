window.addEventListener("message", (event) => {
  if (event.data !== "EXPORT_SELECTED_ANIM_FRAMES") return;

  const script = `
    (function () {
      try {
        var original = app.activeDocument;
        var sel = original.activeLayer;

        if (!sel || sel.typename !== "LayerSet" || !sel.name.startsWith("anim_")) {
          app.echoToOE("[plugin] ❌ Please select an 'anim_*' folder.");
          return;
        }

        var temp = app.documents.add(
          original.width,
          original.height,
          original.resolution,
          "_temp_export",
          NewDocumentMode.RGB
        );

        var framesExported = 0;
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
            app.sendToOE(png);
            framesExported++;
          }
        }

        app.activeDocument = temp;
        temp.close(SaveOptions.DONOTSAVECHANGES);

        if (framesExported === 0) {
          app.echoToOE("[plugin] ❌ No visible layers exported.");
        } else {
          app.echoToOE("[plugin] ✅ PNGs exported");
        }

      } catch (e) {
        app.echoToOE("[plugin] ❌ ERROR: " + e.message);
      }
    })();
  `;

  parent.postMessage(script, "*");
});
