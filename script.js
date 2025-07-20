function handleUpdateLayerNumbers() {
  const script = `
    var doc = app.activeDocument;
    var renameCommands = [];

    for (var i = 0; i < doc.layers.length; i++) {
      var folder = doc.layers[i];

      if (!folder.isGroup || folder.name.indexOf("anim_") !== 0) continue;

      var frameLayers = [];

      for (var j = 0; j < folder.layers.length; j++) {
        var layer = folder.layers[j];
        if (!layer.isGroup) {
          frameLayers.push(layer);
        }
      }

      var max = frameLayers.length;
      if (max === 0) continue;

      var baseName = frameLayers[max - 1].name;

      for (var k = 0; k < max; k++) {
        var frameNum = max - k;
        var layerID = frameLayers[k]._id; // unique layer ID
        var newName = frameNum + "/" + max + " " + baseName;
        renameCommands.push({ id: layerID, name: newName });
      }
    }

    renameCommands;
  `;

  // Step 1: Ask Photopea to generate renameCommands[]
  const listener = (e) => {
    if (Array.isArray(e.data)) {
      window.removeEventListener("message", listener);

      // Step 2: For each rename, send script string using your proven rename method
      e.data.forEach(cmd => {
        const singleRenameScript = `
          var doc = app.activeDocument;
          var layer = doc.findLayerById(${cmd.id});
          if (layer) layer.name = ${JSON.stringify(cmd.name)};
        `;
        window.parent.postMessage(singleRenameScript, "*");
      });

      alert("Layer Numbers Updated");
    }
  };

  window.addEventListener("message", listener);
  window.parent.postMessage(script, "*");
}
