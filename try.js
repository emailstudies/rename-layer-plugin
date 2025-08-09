// Playback module (reset after full max loop, no async/await)
const Playback = (() => {
  let shouldStop = false;
  let currentTimerId = null;

  function clearTimer() {
    if (currentTimerId !== null) {
      clearTimeout(currentTimerId);
      currentTimerId = null;
    }
  }

  // Show only the given frame index in all visible groups
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
        app.echoToOE("👁️ Reset or show index ${index}");
      })();
    `;
    parent.postMessage(script, "*");
  }

  // Reset all visible groups to Layer 1 (index n-1)
  function resetAllVisibleToLayer1() {
    const script = `
      (function () {
        var doc = app.activeDocument;
        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            var targetIndex = group.layers.length - 1;
            for (var j = 0; j < group.layers.length; j++) {
              group.layers[j].visible = (j === targetIndex);
            }
          }
        }
        app.echoToOE("🔄 Reset all groups to Layer 1");
      })();
    `;
    parent.postMessage(script, "*");
  }

  // Get max frame count across all visible groups (sync-ish)
  function getMaxFrameCount() {
    let maxCount = 0;
    const script = `
      (function () {
        var doc = app.activeDocument;
        var counts = [];
        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            counts.push(group.layers.length);
          }
        }
        app.echoToOE("✅ maxCount " + Math.max.apply(null, counts));
      })();
    `;
    parent.postMessage(script, "*");
    // You can capture the echoed value in your own listener,
    // but if you already know it beforehand, skip this.
    return maxCount;
  }

  function cycleFrames(total, delay, reverse, pingpong) {
    let i = reverse ? 0 : total - 1;
    let direction = reverse ? 1 : -1;
    let goingForward = true;
    let frameCounter = 0;

    clearTimer();
    shouldStop = false;

    function next() {
      if (shouldStop) {
        clearTimer();
        return;
      }

      // Show frame
      showOnlyFrame(i);
      frameCounter++;

      // If we've reached the total frames, reset and start over
      if (frameCounter >= total) {
        frameCounter = 0;
        resetAllVisibleToLayer1();
        i = reverse ? 0 : total - 1;
        direction = reverse ? 1 : -1;
        goingForward = true;
        currentTimerId = setTimeout(next, delay);
        return;
      }

      // Advance
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

      currentTimerId = setTimeout(next, delay);
    }

    next();
  }

  function startPlayback() {
    shouldStop = false;
    const frameCount = getSelectedMaxCount(); // replace with your existing logic
    if (frameCount <= 0) {
      console.log("❌ No frames to play");
      return;
    }

    resetAllVisibleToLayer1(); // ensure all start in sync
    const delay = getSelectedDelay();
    const reverse = document.getElementById("reverseChk").checked;
    const pingpong = document.getElementById("pingpongChk").checked;
    cycleFrames(frameCount, delay, reverse, pingpong);
  }

  function stopPlayback() {
    shouldStop = true;
    clearTimer();
  }

  return { startPlayback, stopPlayback };
})();

document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("renameBtn");
  const stopBtn = document.getElementById("stopBtn");
  if (playBtn) playBtn.onclick = () => Playback.startPlayback();
  if (stopBtn) stopBtn.onclick = () => Playback.stopPlayback();
});
