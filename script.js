function showOnlyFrame(index) {
  const script = `
    (function () {
      var doc = app.activeDocument;
      var animGroup = null;

      // Find 'anim_preview' group
      for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
          animGroup = layer;
          break;
        }
      }

      if (!animGroup) {
        app.echoToOE("❌ 'anim_preview' not found.");
        return;
      }

      // Hide all layers
      for (var i = 0; i < doc.layers.length; i++) {
        doc.layers[i].visible = false;
      }

      // Hide all inside anim_preview
      for (var i = 0; i < animGroup.layers.length; i++) {
        animGroup.layers[i].visible = false;
      }

      // Show only the target frame
      if (${index} < animGroup.layers.length) {
        animGroup.visible = true;
        animGroup.layers[${index}].visible = true;
        app.echoToOE("👁️ Showing frame ${index}");
      }
    })();`;

  parent.postMessage(script, "*");
}

function cycleFrames(total, delay = 300) {
  let i = 0;

  function next() {
    if (i >= total) return;
    showOnlyFrame(i);
    i++;
    setTimeout(next, delay);
  }

  next();
}

// Hook to a button
document.getElementById("renameBtn").onclick = () => {
  const totalFrames = 5; // Change to your actual number of frames
  cycleFrames(totalFrames, 300);
};
