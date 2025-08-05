window.addEventListener("message", (event) => {
  if (event.data !== "EXPORT_SELECTED_ANIM_FRAMES") return;

  const script = `
(function () {
  try {
    var original = app.activeDocument;
    var selected = original.activeLayer;

    if (!selected || selected.typename !== "LayerSet" || !selected.name.startsWith("anim_")) {
      app.echoToOE("❌ Please select a folder named 'anim_*' at root.");
      return;
    }

    // Create a temporary export document with same dimensions
    var temp = app.documents.add(
      original.width,
      original.height,
      original.resolution,
      "_temp_export",
      NewDocumentMode.RGB,
      DocumentFill.TRANSPARENT
    );

    // Loop through all layers inside the selected anim_* folder (top to bottom)
    for (var i = selected.layers.length - 1; i >= 0; i--) {
      var frame = selected.layers[i];

      if (!frame.visible || frame.locked || frame.kind === undefined) continue;

      // Switch to temp and clear previous frame
      app.activeDocument = temp;
      while (temp.layers.length > 0) temp.layers[0].remove();

      // Duplicate this frame into temp
      app.activeDocument = original;
      original.activeLayer = frame;
      frame.duplicate(temp, ElementPlacement.PLACEATBEGINNING);

      // Save PNG and send to plugin
      app.activeDocument = temp;
      var png = temp.saveToOE("png");
      app.sendToOE(png);
    }

    // Close temp doc
    app.activeDocument = temp;
    temp.close(SaveOptions.DONOTSAVECHANGES);

    // Confirm done
    app.echoToOE("✅ PNGs exported");
  } catch (e) {
    app.echoToOE("❌ ERROR: " + e.message);
  }
})();
  `;

  parent.postMessage(script, "*");
  console.log("📤 Export script sent to Photopea");
});
