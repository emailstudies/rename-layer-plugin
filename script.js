// Playback module for anim_preview frames, ready for external call

const Playback = (() => {
  let shouldStop = false;
  let currentTimerId = null;

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

        if (${index} >= 0 && ${index} < animGroup.layers.length) {
          animGroup.layers[${index}].visible = true;
          app.echoToOE("👁️ Showing frame ${index}");
        }
      })();
    `;

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
      })();
    `;

    function handleCount(event) {
      if (typeof event.data === "string" && event.data.startsWith("✅ count")) {
        const count = parseInt(event.data.split(" ")[2], 10);
        if (!isNaN(count)) {
          console.log("🧮 Detected frames in anim_preview:", count);
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

  function cycleFramesRange(start, stop, delay, reverse, pingpong, frameCount) {
    console.log(`▶️ cycleFramesRange playing frames from ${start} to ${stop}, delay=${delay}ms, reverse=${reverse}, pingpong=${pingpong}`);

    let startIndex = frameCount - start;
    let stopIndex = frameCount - stop;

    if (startIndex < stopIndex) [startIndex, stopIndex] = [stopIndex, startIndex];

    let i = reverse ? stopIndex : startIndex;
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
          if ((direction === 1 && i > startIndex) || (direction === -1 && i < stopIndex)) {
            goingForward = false;
            i -= 2 * direction;
          }
        } else {
          i -= direction;
          if ((direction === 1 && i < stopIndex) || (direction === -1 && i > startIndex)) {
            goingForward = true;
            i += 2 * direction;
          }
        }
      } else {
        i += direction;
        if (direction === -1 && i < stopIndex) i = startIndex;
        if (direction === 1 && i > startIndex) i = stopIndex;
      }

      currentTimerId = setTimeout(next, delay);
    }

    next();
  }

  function stopPlayback() {
    shouldStop = true;
    clearTimer();
    console.log("🛑 Playback stopped by user");
  }

  function startPlayback() {
    shouldStop = false;

    getFrameCount((frameCount) => {
      if (frameCount <= 0) {
        console.log("❌ No frames found in anim_preview.");
        return;
      }

      let start = parseInt(document.getElementById("startFrameInput").value.trim(), 10);
      let stop = parseInt(document.getElementById("stopFrameInput").value.trim(), 10);

      if (isNaN(start) || start < 1) start = 1;
      if (isNaN(stop) || stop > frameCount) stop = frameCount;

      if (start > stop) {
        alert("⚠️ Start frame cannot be greater than Stop frame.");
        return;
      }

      const delay = getSelectedDelay();
      const reverse = document.getElementById("reverseChk").checked;
      const pingpong = document.getElementById("pingpongChk").checked;

      if (start === 1 && stop === frameCount) {
        cycleFrames(frameCount, delay, reverse, pingpong);
      } else {
        cycleFramesRange(start, stop, delay, reverse, pingpong, frameCount);
      }
    });
  }

  return {
    startPlayback,
    stopPlayback,
  };
})();

// Example usage:
// Playback.startPlayback();
// Playback.stopPlayback();

// Optional: bind buttons outside the module
document.getElementById("renameBtn").onclick = () => Playback.startPlayback();
document.getElementById("stopBtn").onclick = () => Playback.stopPlayback();

document.getElementById("manualDelay").addEventListener("input", updateDelayInputState);
