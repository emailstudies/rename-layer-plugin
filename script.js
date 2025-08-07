function showOnlyFrame(index) {
  const script = `
    (function () {
      var doc = app.activeDocument;
      var animGroup = null;
      var bgLayer = null;

      // Identify 'anim_preview' and 'Background' layers
      for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
          animGroup = layer;
        } else if (layer.name.toLowerCase() === "background") {
          bgLayer = layer;
        } else {
          // Hide all other top-level layers
          layer.visible = false;
        }
      }

      if (!animGroup) {
        app.echoToOE("❌ 'anim_preview' not found.");
        return;
      }

      // Keep 'anim_preview' and 'Background' visible
      if (animGroup) animGroup.visible = true;
      if (bgLayer) bgLayer.visible = true;

      // Hide all children inside anim_preview
      for (var i = 0; i < animGroup.layers.length; i++) {
        animGroup.layers[i].visible = false;
      }

      // Show only the target child layer
      if (${index} < animGroup.layers.length) {
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

// Hook to button
document.getElementById("renameBtn").onclick = () => {
  const totalFrames = 5; // ✅ Set to anim_preview.layers.length
  cycleFrames(totalFrames, 300);
};
