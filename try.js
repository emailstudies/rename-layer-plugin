const Playback = (() => {
  let shouldStop = false;
  let currentTimerId = null;
  let maxFrameCount = 0;

  // Send a script string to Photopea
  function sendScript(script) {
    parent.postMessage(script, "*");
  }

  // Show synced frame across all visible folders using reverse indexing logic
  function showOnlyFrame(frameIndex) {
    const script = `
      (function () {
        var doc = app.activeDocument;
        var folders = [];
        var bgLayer = null;

        // Find root background layer and visible folders
        for (var i = 0; i < doc.layers.length; i++) {
          var layer = doc.layers[i];
          if (layer.name.toLowerCase() === "background") {
            bgLayer = layer;
            bgLayer.visible = true; // Always keep background visible
          } else if (layer.typename === "LayerSet" && layer.visible) {
            folders.push(layer);
          } else if (layer.typename !== "LayerSet") {
            // Leave other root non-folder layers as-is (do not hide)
          }
        }

        if (folders.length === 0) {
          app.echoToOE("❌ No visible folders found.");
          return;
        }

        // Find max frames count across folders
        var maxFrames = 0;
        for (var f = 0; f < folders.length; f++) {
          if (folders[f].layers.length > maxFrames) {
            maxFrames = folders[f].layers.length;
          }
        }

        // Show/hide layers in each folder synced by reverse indexing
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

  // Request max frame count by asking Photopea
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

  // Clear any scheduled timers
  function clearTimer() {
    if (currentTimerId !== null) {
      clearTimeout(currentTimerId);
      currentTimerId = null;
    }
  }

  // Main playback loop with correct reverse + pingpong support and synced start
  function cycleFrames(total, delay, reverse, pingpong) {
    clearTimer();
    shouldStop = false;

    let i, direction, goingForward = true;

    // Logic for starting index and direction that respects syncing across folders
    if (!pingpong) {
      if (reverse) {
        i = 0;
        direction = 1;
      } else {
        i = total - 1;
        direction = -1;
      }
    } else {
      if (reverse) {
        i = 0;
        direction = 1;
      } else {
        i = total - 1;
        direction = -1;
      }
    }

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
          if (i < 0 || i >= total) {
            goingForward = false;
            i -= 2 * direction;
          }
        } else {
          i -= direction;
          if (i >= total || i < 0) {
            goingForward = true;
            i += 2 * direction;
          }
        }
      } else {
        i += direction;
        if (i < 0) i = total - 1;
        if (i >= total) i = 0;
      }

      currentTimerId = setTimeout(next, delay);
    }

    next();
  }

  // Start playback - uses helpers.js delay getters
  function startPlayback() {
    shouldStop = false;

    getMaxFrameCount((count) => {
      if (count <= 0) {
        console.log("❌ No frames found in visible folders.");
        return;
      }
      maxFrameCount = count;

      const delay = getSelectedDelay();

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

// Hook up buttons to module
document.getElementById("renameBtn").onclick = () => Playback.startPlayback();
document.getElementById("stopBtn").onclick = () => Playback.stopPlayback();

// Update fps select disable state if manual delay input changes
document.getElementById("manualDelay").addEventListener("input", updateDelayInputState);
