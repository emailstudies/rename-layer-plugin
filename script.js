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
      animGroup.visible = true;
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

function getFrameCount(callback) {
  const script = `
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
      } else {
        app.echoToOE("✅ count " + animGroup.layers.length);
      }
    })();`;

  window.addEventListener("message", function handleCount(event) {
    if (typeof event.data === "string" && event.data.startsWith("✅ count")) {
      const count = parseInt(event.data.split(" ")[2], 10);
      if (!isNaN(count)) {
        console.log("🧮 Detected frames in anim_preview:", count);
        window.removeEventListener("message", handleCount);
        callback(count);
      }
    }
  });

  parent.postMessage(script, "*");
}

function cycleFrames(total, delay = 300) {
  let i = total - 1;
  function next() {
    if (i < 0) return;
    showOnlyFrame(i);
    i--;
    setTimeout(next, delay);
  }
  next();
}

document.getElementById("renameBtn").onclick = () => {
  let fps = parseFloat(document.getElementById("newName").value);
  if (isNaN(fps) || fps <= 0) {
    fps = 3; // default fallback FPS
  }
  const delay = 1000 / fps;

  console.log("🎞️ Using FPS:", fps, "→ Delay:", delay.toFixed(1), "ms");

  getFrameCount((frameCount) => {
    if (frameCount > 0) {
      cycleFrames(frameCount, delay);
    } else {
      console.log("No frames found in anim_preview.");
    }
  });
};
