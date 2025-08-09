const Playback = (() => {
  let shouldStop = false;
  let currentTimerId = null;
  let maxFrameCount = 0;

  function sendScript(script) {
    parent.postMessage(script, "*");
  }

  function showOnlyFrame(frameIndex) {
    const script = `
      (function () {
        var doc = app.activeDocument;
        var folders = [];
        var bgLayer = null;

        for (var i = 0; i < doc.layers.length; i++) {
          var layer = doc.layers[i];
          if (layer.name.toLowerCase() === "background") {
            bgLayer = layer;
            bgLayer.visible = true;
          } else if (layer.typename === "LayerSet" && layer.visible) {
            folders.push(layer);
          }
        }

        if (folders.length === 0) {
          app.echoToOE("❌ No visible folders found.");
          return;
        }

        var maxFrames = 0;
        for (var f = 0; f < folders.length; f++) {
          if (folders[f].layers.length > maxFrames) {
            maxFrames = folders[f].layers.length;
          }
        }

        for (var f = 0; f < folders.length; f++) {
          var folder = folders[f];
          var totalFrames = folder.layers.length;
          for (var l = 0; l < totalFrames; l++) {
            folder.layers[l].visible = false;
          }
          var idx = totalFrames - 1 - (maxFrames - 1 - ${frameIndex});
          if (idx >= 0 && idx < totalFrames) {
            folder.layers[idx].visible = true;
          }
          folder.visible = true;
        }

        app.echoToOE("👁️ Showing synced frame " + ${frameIndex} + " / max " + maxFrames);
      })();
    `;
    sendScript(script);
  }

  function getMaxFrameCount(callback) {
    const script = `
      (function () {
        var doc = app.activeDocument;
        var maxFrames = 0;
        for (var i = 0; i < doc.layers.length; i++) {
          var layer = doc.layers[i];
          if (layer.typename === "LayerSet" && layer.visible) {
            if (layer.layers.length > maxFrames) maxFrames = layer.layers.length;
          }
        }
        app.echoToOE("✅ maxFrames " + maxFrames);
      })();
    `;

    function handleMessage(event) {
      if (typeof event.data === "string" && event.data.startsWith("✅ maxFrames")) {
        const count = parseInt(event.data.split(" ")[2], 10);
        if (!isNaN(count)) {
          window.removeEventListener("message", handleMessage);
          callback(count);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    sendScript(script);
  }

  function clearTimer() {
    if (currentTimerId !== null) {
      clearTimeout(currentTimerId);
      currentTimerId = null;
    }
  }

  // Extended playback supporting reverse & pingpong modes
  function cycleFrames(total, delay, reverse, pingpong) {
    clearTimer();
    shouldStop = false;

    // i = current frame index, direction = 1 or -1 step
    let i = reverse ? total - 1 : 0;
    let direction = reverse ? -1 : 1;
    let goingForward = true; // for pingpong mode

    function next() {
      if (shouldStop) {
        clearTimer();
        app.echoToOE && app.echoToOE("🛑 Playback stopped.");
        return;
      }

      showOnlyFrame(i);

      if (pingpong) {
        if (goingForward) {
          i += direction;
          // If out of bounds, flip direction
          if (i >= total || i < 0) {
            goingForward = false;
            i -= 2 * direction;
          }
        } else {
          i -= direction;
          // When flipping back, reset direction again
          if (i < 0 || i >= total) {
            goingForward = true;
            i += 2 * direction;
          }
        }
      } else {
        // Normal looping
        i += direction;
        if (i >= total) i = 0;
        if (i < 0) i = total - 1;
      }

      currentTimerId = setTimeout(next, delay);
    }

    next();
  }

  function startPlayback() {
    shouldStop = false;

    getMaxFrameCount((count) => {
      if (count <= 0) {
        console.log("❌ No frames found in visible folders.");
        return;
      }
      maxFrameCount = count;

      // Get delay from UI
      let manualDelay = parseFloat(document.getElementById("manualDelay").value);
      let delay;
      if (!isNaN(manualDelay) && manualDelay > 0) {
        delay = manualDelay * 1000;
      } else {
        let fps = parseInt(document.getElementById("fpsSelect").value, 10);
        delay = 1000 / (fps || 12);
      }

      const reverse = document.getElementById("reverseChk").checked;
      const pingpong = document.getElementById("pingpongChk").checked;

      cycleFrames(maxFrameCount, delay, reverse, pingpong);
    });
  }

  function stopPlayback() {
    shouldStop = true;
    clearTimer();
  }

  return {
    startPlayback,
    stopPlayback,
  };
})();

// Hook up your buttons
document.getElementById("renameBtn").onclick = () => Playback.startPlayback();
document.getElementById("stopBtn").onclick = () => Playback.stopPlayback();

document.getElementById("manualDelay").addEventListener("input", updateDelayInputState);
