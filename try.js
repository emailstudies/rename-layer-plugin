// Playback module for multi-folder frame sync animation
const Playback = (() => {
  let shouldStop = false;
  let currentTimerId = null;

  // Show specific frame index for all visible groups
  function showOnlyFrame(index) {
    const script = `
      (function () {
        var doc = app.activeDocument;

        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            // Hide all layers
            for (var j = 0; j < group.layers.length; j++) {
              group.layers[j].visible = false;
            }
            // Show target layer if in range
            if (${index} >= 0 && ${index} < group.layers.length) {
              group.layers[${index}].visible = true;
            }
          }
        }
        app.echoToOE("👁️ Showing frame index ${index}");
      })();
    `;
    parent.postMessage(script, "*");
  }

  // Reset all visible groups to Layer 1 (index = n-1)
  function resetAllToLayer1() {
    const script = `
      (function () {
        var doc = app.activeDocument;
        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            if (group.layers.length > 0) {
              var targetIndex = group.layers.length - 1; // Layer 1 in your terms
              for (var j = 0; j < group.layers.length; j++) {
                group.layers[j].visible = (j === targetIndex);
              }
            }
          }
        }
        app.echoToOE("🔄 Reset all groups to Layer 1");
      })();
    `;
    parent.postMessage(script, "*");
  }

  // Get maximum frame count among visible groups
  function getMaxFrameCount(callback) {
    const script = `
      (function () {
        var doc = app.activeDocument;
        var maxCount = 0;
        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            if (group.layers.length > maxCount) {
              maxCount = group.layers.length;
            }
          }
        }
        app.echoToOE("✅ maxCount " + maxCount);
      })();
    `;
    function handleCount(event) {
      if (typeof event.data === "string" && event.data.startsWith("✅ maxCount")) {
        const count = parseInt(event.data.split(" ")[2], 10);
        if (!isNaN(count)) {
          console.log("🧮 Max frame count across groups:", count);
          window.removeEventListener("message", handleCount);
          callback(count);
        }
      }
    }
    window.addEventListener("message", handleCount);
    parent.postMessage(script, "*");
  }

  // Stop timer
  function clearTimer() {
    if (currentTimerId !== null) {
      clearTimeout(currentTimerId);
      currentTimerId = null;
    }
  }

  // Playback loop
  function cycleFrames(total, delay, reverse, pingpong) {
    console.log(`▶️ Playing total=${total}, delay=${delay}ms, reverse=${reverse}, pingpong=${pingpong}`);

    // Starting index so Layer 1 (n-1) shows first
    let i = reverse ? 0 : total - 1;
    let direction = reverse ? 1 : -1;
    let loopCount = 0; // Count frames to detect full loop
    let goingForward = true;

    clearTimer();
    shouldStop = false;

    function next() {
      if (shouldStop) {
        console.log("🛑 Animation stopped.");
        clearTimer();
        return;
      }

      showOnlyFrame(i);
      console.log(`▶️ Showing frame index: ${i}`);

      loopCount++;
      if (loopCount >= total) {
        resetAllToLayer1();
        loopCount = 0;
      }

      if (pingpong) {
        if (goingForward) {
          i += direction;
          if (i >= total || i < 0) {
            goingForward = false;
            i -= direction * 2;
          }
        } else {
          i -= direction;
          if (i < 0 || i >= total) {
            goingForward = true;
            i += direction * 2;
          }
        }
      } else {
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

    getMaxFrameCount((frameCount) => {
      if (frameCount <= 0) {
        console.log("❌ No frames found.");
        return;
      }

      const delay = getSelectedDelay();
      const reverse = document.getElementById("reverseChk").checked;
      const pingpong = document.getElementById("pingpongChk").checked;

      cycleFrames(frameCount, delay, reverse, pingpong);
    });
  }

  function stopPlayback() {
    shouldStop = true;
    clearTimer();
    console.log("🛑 Playback stopped by user");
  }

  return {
    startPlayback,
    stopPlayback,
  };
})();

// Bind buttons
document.getElementById("renameBtn").onclick = () => Playback.startPlayback();
document.getElementById("stopBtn").onclick = () => Playback.stopPlayback();
document.getElementById("manualDelay").addEventListener("input", updateDelayInputState);
