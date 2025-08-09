// Playback module with clean reset + echo logs
const Playback = (() => {
  let shouldStop = false;
  let currentTimerId = null;

  function waitForEcho(prefix) {
    return new Promise((resolve) => {
      function handler(event) {
        if (typeof event.data === "string" && event.data.startsWith(prefix)) {
          window.removeEventListener("message", handler);
          console.log(`📢 Echo received: ${event.data}`);
          resolve(event.data);
        }
      }
      window.addEventListener("message", handler);
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      currentTimerId = setTimeout(() => {
        currentTimerId = null;
        resolve();
      }, ms);
    });
  }

  function clearTimer() {
    if (currentTimerId !== null) {
      clearTimeout(currentTimerId);
      currentTimerId = null;
    }
  }

  function showOnlyFrameAsync(index) {
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
        app.echoToOE("👁️ Frame index ${index} applied");
      })();
    `;
    parent.postMessage(script, "*");
    return waitForEcho("👁️ Frame index");
  }

  // NEW: reset all visible groups to layer 0 (top layer)
  function resetAllVisibleGroupsToLayer0Async() {
    const script = `
      (function () {
        var doc = app.activeDocument;
        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && group.visible) {
            for (var j = 0; j < group.layers.length; j++) {
              group.layers[j].visible = (j === 0);
            }
          }
        }
        app.echoToOE("🔄 All visible groups reset to layer 0");
      })();
    `;
    parent.postMessage(script, "*");
    return waitForEcho("🔄 All visible groups reset to layer 0");
  }

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
          console.log(`📢 Echo received: ${event.data}`);
          const count = parseInt(event.data.split(" ")[2], 10);
          resolve(isNaN(count) ? 0 : count);
        }
      }
      window.addEventListener("message", handler);
    });
  }

  async function cycleFrames(total, delay, reverse, pingpong) {
    console.log(`▶️ Starting playback total=${total}, delay=${delay}ms, reverse=${reverse}, pingpong=${pingpong}`);

    let i = reverse ? 0 : total - 1;
    let direction = reverse ? 1 : -1;
    let loopFrames = 0;

    clearTimer();
    shouldStop = false;

    while (!shouldStop) {
      await showOnlyFrameAsync(i);

      loopFrames++;
      if (loopFrames >= total) {
        loopFrames = 0;
        await resetAllVisibleGroupsToLayer0Async(); // call our clean reset function
        i = reverse ? 0 : total - 1;
        direction = reverse ? 1 : -1;
        if (shouldStop) break;
        await sleep(delay);
        continue;
      }

      if (pingpong) {
        i += direction;
        if (i >= total || i < 0) {
          direction *= -1;
          i += direction * 2;
        }
      } else {
        i += direction;
        if (i >= total) i = 0;
        if (i < 0) i = total - 1;
      }

      if (shouldStop) break;
      await sleep(delay);
    }

    clearTimer();
    console.log("⏹️ Playback stopped");
  }

  async function startPlayback() {
    shouldStop = false;
    const frameCount = await getMaxFrameCountAsync();
    if (frameCount <= 0) {
      console.log("❌ No frames found.");
      return;
    }
    await resetAllVisibleGroupsToLayer0Async();
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
  document.getElementById("renameBtn").onclick = () => Playback.startPlayback();
  document.getElementById("stopBtn").onclick = () => Playback.stopPlayback();
  document.getElementById("manualDelay").addEventListener("input", updateDelayInputState);
});
