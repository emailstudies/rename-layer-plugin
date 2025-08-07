function showOnlyFrame(index) {
  const script = `
    (function () {
      var doc = app.activeDocument;
      var animGroup = null;
      var bgLayer = null;
 
      // First, identify background layer by name
      for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.name.toLowerCase() === "background") {
          bgLayer = layer;
        }
        if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
          animGroup = layer;
        }
      }

      if (!animGroup) {
        app.echoToOE("❌ 'anim_preview' not found.");
        return;
      }

      // Loop through all top-level layers
      for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];

        if (layer === bgLayer || layer === animGroup) {
          layer.visible = true;
        } else {
          layer.visible = false;
        }
      }

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
  const totalFrames = 5; // ✅ Set this to actual anim_preview layer count
  cycleFrames(totalFrames, 300);
};
