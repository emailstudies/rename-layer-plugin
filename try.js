const Playback = (() => {
  let shouldStop = false;
  let currentTimerId = null;
  let totalFrames = 0;

  // Show a specific frame index across all visible groups
  function showOnlyFrame(index) {
    const script = `
      (function () {
        var doc = app.activeDocument;
        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            for (var j = 0; j < group.layers.length; j++) {
              group.layers[j].visible = false;
            }
            if (${index} >= 0 && ${index} < group.layers.length) {
              group.layers[${index}].visible = true;
            }
          }
        }
        app.echoToOE("👁 Showing frame index ${index}");
      })();
    `;
    parent.postMessage(script, "*");
  }

  // Reset all visible groups to Layer 1 (index n-1)
  function resetAllToLayer1() {
    const script = `
      (function () {
        var doc = app.activeDocument;
        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            if (group.layers.length > 0) {
              var targetIndex = group.layers.length - 1;
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

  // Get max frame count from visible groups
  function getMaxFrameCount(callback) {
    function handler(event) {
      if (typeof event.data === "string" && event.data.startsWith("✅ maxCount")) {
        window.removeEventListener("message", handler);
        const count = parseInt(event.data.split(" ")[2], 10);
        callback(isNaN(count) ? 0 : count);
      }
    }
    window.addEventListener("message", handler);

    const script = `
      (function () {
        var doc = app.activeDocument;
        var maxCount = 0;
        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            if (group.layers.length > maxCount) maxCount = group.layers.length;
          }
        }
        app.echoToOE("✅ maxCount " + maxCount);
      })();
    `;
    parent.postMessage(script, "*");
  }

  function clearTimer() {
    if (currentTimerId !== null) {
      clearTimeout(currentTimerId);
      currentTimerId = null;
    }
  }

  function cycleFrames(total, delay, reverse, pingpong) {
    let i = reverse ? 0 : total - 1;
    let direction = reverse ? 1 : -1;
    let goingForward = true;
    let frameCounter = 0;

    clearTimer();
    shouldStop = false;

    function next() {
      if (shouldStop) return;

      showOnlyFrame(i);
      frameCounter++;

      // Reset after completing full max loop
      if (frameCounter >= total) {
        resetAllToLayer1();
        frameCounter = 0;
        i = reverse ? 0 : total - 1;
        direction = reverse ? 1 : -1;
        goingForward = true;
      } else {
        // Advance frame index
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
          if (i >= total) i = 0;
          if (i < 0) i = total - 1;
        }
      }

      currentTimerId = setTimeout(next, delay);
    }

    next();
  }

  function startPlayback() {
    shouldStop = false;
    getMaxFrameCount((count) => {
      if (count <= 0) {
        console.log("❌ No frames found");
        return;
      }
      totalFrames = count;
      resetAllToLayer1();
      const delay = getSelectedDelay();
      const reverse = document.getElementById("reverseChk").checked;
      const pingpong = document.getElementById("pingpongChk").checked;
      cycleFrames(totalFrames, delay, reverse, pingpong);
    });
  }

  function stopPlayback() {
    shouldStop = true;
    clearTimer();
    console.log("🛑 Playback stopped");
  }

  return { startPlayback, stopPlayback };
})();

document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("renameBtn");
  const stopBtn = document.getElementById("stopBtn");
  if (playBtn) playBtn.onclick = () => Playback.startPlayback();
  if (stopBtn) stopBtn.onclick = () => Playback.stopPlayback();
});
