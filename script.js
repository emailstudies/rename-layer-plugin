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
  let i = total - 1; // Reverse for Photopea's visual order

  function next() {
    if (i < 0) return;
    showOnlyFrame(i);
    i--;
    setTimeout(next, delay);
  }

  next();
}

document.getElementById("renameBtn").onclick = () => {
  const fpsInput = document.getElementById("newName");
  let fps = parseFloat(fpsInput.value);

  if (isNaN(fps) || fps < 1) fps = 12; // Default fallback
  const delay = 1000 / fps;

  const getFrameCountScript = `
    (function () {
      var doc = app.activeDocument;
      var animGroup = null;
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

      var count = animGroup.layers.length;
      app.echoToOE("FRAME_COUNT::" + count);
    })();`;

  parent.postMessage(getFrameCountScript, "*");

  // Listen for frame count echo
  window.addEventListener("message", function handleMsg(e) {
    if (typeof e.data === "string" && e.data.startsWith("FRAME_COUNT::")) {
      const totalFrames = parseInt(e.data.split("::")[1]);
      console.log("✅ Frame count:", totalFrames);
      cycleFrames(totalFrames, delay);
      window.removeEventListener("message", handleMsg);
    }
  });
};
