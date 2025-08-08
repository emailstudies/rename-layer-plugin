let shouldStop = false;

function showWarning(message) {
  alert(message); // You can customize this UI later if you want
}

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
  let i = stopIndex; // Reverse playback starting at stopIndex

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation loop stopped.");
      return;
    }

    showOnlyFrame(i);
    i--;
    if (i < startIndex) i = stopIndex;

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
      const stopInput = document.getElementById("stopFrameInput");
      stopInput.max = frameCount;

      let userStop = parseInt(stopInput.value, 10);
      if (isNaN(userStop) || userStop < 1) {
        userStop = frameCount;
      } else if (userStop > frameCount) {
        showWarning(`Stop Frame cannot be greater than total frames (${frameCount}). Clamping to ${frameCount}.`);
        userStop = frameCount;
        stopInput.value = frameCount;
      }

      if (!stopInput.value) stopInput.value = frameCount;

      let start = parseInt(document.getElementById("startFrameInput").value, 10);
      if (isNaN(start) || start < 1) start = 1;

      if (userStop < start) {
        showWarning("Stop Frame cannot be less than Start Frame. Adjusting Stop Frame to Start Frame.");
        userStop = start;
        stopInput.value = start;
      }

      const startIndex = start - 1;
      const stopIndex = userStop - 1;

      console.log(`🎞️ Playing frames ${start} to ${userStop} at FPS:`, fps, "→ Delay:", delay.toFixed(1), "ms");
      cycleFramesRange(startIndex, stopIndex, delay);
    } else {
      console.log("No frames found in anim_preview.");
    }
  });
};

document.getElementById("stopBtn").onclick = () => {
  shouldStop = true;
};
