let shouldStop = false;

function showOnlyFrame(index) {
  const script = `
    (function () {
      var doc = app.activeDocument;
      var animGroup = null;
      var bgLayer = null;

      for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
          animGroup = layer;
        } else if (layer.name.toLowerCase() === "background") {
          bgLayer = layer;
        } else {
          layer.visible = false;
        }
      }

      if (!animGroup) {
        app.echoToOE("❌ 'anim_preview' not found.");
        return;
      }

      animGroup.visible = true;
      if (bgLayer) bgLayer.visible = true;

      for (var i = 0; i < animGroup.layers.length; i++) {
        animGroup.layers[i].visible = false;
      }

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

function cycleFramesRange(startIndex, stopIndex, delay = 300) {
  let i = startIndex;

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation loop stopped.");
      return;
    }

    showOnlyFrame(i);
    i++;
    if (i > stopIndex) i = startIndex;

    setTimeout(next, delay);
  }

  next();
}

document.getElementById("renameBtn").onclick = () => {
  shouldStop = false;
  let fps = parseFloat(document.getElementById("fpsInput").value);
  if (isNaN(fps) || fps <= 0) fps = 3;
  const delay = 1000 / fps;

  getFrameCount((frameCount) => {
    if (frameCount > 0) {
      // Update stop frame max and clamp
      const stopInput = document.getElementById("stopFrameInput");
      stopInput.max = frameCount;
      if (parseInt(stopInput.value, 10) > frameCount) {
        stopInput.value = frameCount;
      }
      if (!stopInput.value) stopInput.value = frameCount;

      // Get start and stop frame from user input, clamp and fix invalid ranges
      let start = parseInt(document.getElementById("startFrameInput").value, 10);
      let stop = parseInt(stopInput.value, 10);

      if (isNaN(start) || start < 1) start = 1;
      if (isNaN(stop) || stop > frameCount) stop = frameCount;
      if (stop < start) stop = start;

      // Convert to zero-based index
      const startIndex = start - 1;
      const stopIndex = stop - 1;

      console.log(`🎞️ Playing frames ${start} to ${stop} at FPS:`, fps, "→ Delay:", delay.toFixed(1), "ms");
      cycleFramesRange(startIndex, stopIndex, delay);
    } else {
      console.log("No frames found in anim_preview.");
    }
  });
};

document.getElementById("stopBtn").onclick = () => {
  shouldStop = true;
};
