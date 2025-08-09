// Playback module for multi-folder frame sync animation (async-safe reset)
const Playback = (() => {
  let shouldStop = false;
  let currentTimerId = null;

  // helper: wait for a parent message echo that starts with `prefix`
  function waitForEcho(prefix) {
    return new Promise((resolve) => {
      function handler(event) {
        if (typeof event.data === "string" && event.data.startsWith(prefix)) {
          window.removeEventListener("message", handler);
          resolve(event.data);
        }
      }
      window.addEventListener("message", handler);
    });
  }

  // show a specific frame index (fire-and-forget)
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
        app.echoToOE("👁️ Showing frame index ${index}");
      })();
    `;
    parent.postMessage(script, "*");
  }

  // reset all visible groups to Layer 1 (index = n-1) AND wait for confirmation
  function resetAllToLayer1Async() {
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
    return waitForEcho("🔄 Reset all groups to Layer 1");
  }

  // get max frame count across visible groups (returns Promise<number>)
  function getMaxFrameCountAsync() {
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
    return new Promise((resolve) => {
      function handler(event) {
        if (typeof event.data === "string" && event.data.startsWith("✅ maxCount")) {
          window.removeEventListener("message", handler);
          const parts = event.data.split(" ");
          const count = parseInt(parts[2], 10);
          resolve(isNaN(count) ? 0 : count);
        }
      }
      window.addEventListener("message", handler);
    });
  }

  function clearTimer() {
    if (currentTimerId !== null) {
      clearTimeout(currentTimerId);
      currentTimerId = null;
    }
  }

  // main playback loop (uses async next() so we can await reset)
  async function cycleFrames(total, delay, reverse, pingpong) {
    console.log(`▶️ Playing total=${total}, delay=${delay}ms, reverse=${reverse}, pingpong=${pingpong}`);

    // start so "Layer 1" (index n-1) is shown first for normal playback:
    let i = reverse ? 0 : total - 1;
    let direction = reverse ? 1 : -1;
    let goingForward = true;
    let loopCount = 0;

    clearTimer();
    shouldStop = false;

    // next is async so we can await resetAllToLayer1Async()
    async function next() {
      if (shouldStop) {
        clearTimer();
        console.log("🛑 Animation stopped.");
        return;
      }

      // show current index across all visible groups
      showOnlyFrame(i);
      console.log(`▶️ Showing frame index: ${i}`);

      loopCount++;

      // When we've shown 'total' frames, synchronously reset everybody to Layer 1
      if (loopCount >= total) {
        loopCount = 0;
        // wait for the reset to finish before continuing playback
        await resetAllToLayer1Async();
        // re-init index/direction to starting state
        i = reverse ? 0 : total - 1;
        direction = reverse ? 1 : -1;
        goingForward = true;
        // schedule next tick after delay
        if (shouldStop) return;
        currentTimerId = setTimeout(next, delay);
        return;
      }

      // advance index according to pingpong / direction (but do not let any group "overtake")
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

      if (!shouldStop) currentTimerId = setTimeout(next, delay);
    }

    // run
    next();
  }

  // start - ensure we reset before starting the cycle so everyone begins aligned
  async function startPlayback() {
    shouldStop = false;
    const frameCount = await getMaxFrameCountAsync();
    if (frameCount <= 0) {
      console.log("❌ No frames found across visible groups.");
      return;
    }

    // always reset to Layer 1 first and wait for confirmation
    await resetAllToLayer1Async();

    const delay = getSelectedDelay();
    const reverse = document.getElementById("reverseChk").checked;
    const pingpong = document.getElementById("pingpongChk").checked;

    // start the loop
    cycleFrames(frameCount, delay, reverse, pingpong);
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

// Bind buttons (wrap to be safe if DOM loaded later)
document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("renameBtn");
  const stopBtn = document.getElementById("stopBtn");
  const manualDelay = document.getElementById("manualDelay");
  if (playBtn) playBtn.onclick = () => Playback.startPlayback();
  if (stopBtn) stopBtn.onclick = () => Playback.stopPlayback();
  if (manualDelay) manualDelay.addEventListener("input", updateDelayInputState);
});
