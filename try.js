// Playback module for multi-folder frame sync animation
const Playback = (() => {
  let shouldStop = false;
  let currentTimerId = null;

  function showOnlyFrame(index) {
    const script = `
      (function () {
        var doc = app.activeDocument;

        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            // Hide all layers in this group
            for (var j = 0; j < group.layers.length; j++) {
              group.layers[j].visible = false;
            }
            // Show the target layer if it exists
            if (${index} >= 0 && ${index} < group.layers.length) {
              group.layers[${index}].visible = true;
            }
            // If the index is out of range, show nothing for this group
          }
        }
        app.echoToOE("👁️ Showing frame index ${index} for all groups");
      })();
    `;
    parent.postMessage(script, "*");
  }

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
          console.log("🧮 Detected max frame count across groups:", count);
          window.removeEventListener("message", handleCount);
          callback(count);
        }
      }
    }
    window.addEventListener("message", handleCount);
    parent.postMessage(script, "*");
  }

  function clearTimer() {
    if (currentTimerId !== null) {
      clearTimeout(currentTimerId);
      currentTimerId = null;
    }
  }

  function cycleFrames(total, delay, reverse, pingpong) {
    console.log(`▶️ cycleFrames playing total=${total}, delay=${delay}ms, reverse=${reverse}, pingpong=${pingpong}`);

    // Restored original reverse behavior
    let i = reverse ? 0 : total - 1;
    let direction = reverse ? 1 : -1;
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

      if (pingpong) {
        if (goingForward) {
          i += direction;
          if ((direction === 1 && i >= total) || (direction === -1 && i < 0)) {
            goingForward = false;
            i -= 2 * direction;
          }
        } else {
          i -= direction;
          if ((direction === 1 && i < 0) || (direction === -1 && i >= total)) {
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

  function startPlayback() {
    shouldStop = false;

    getMaxFrameCount((frameCount) => {
      if (frameCount <= 0) {
        console.log("❌ No frames found in visible groups.");
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
