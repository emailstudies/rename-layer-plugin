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

// Helper to clamp values
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// Backward playback loop between startIdx and stopIdx (zero-based, inclusive)
function cycleFramesBackwardRange(startIdx, stopIdx, delay) {
  console.log(`▶️ Playing backward from frame ${stopIdx} to ${startIdx} with delay ${delay.toFixed(1)} ms`);
  let i = stopIdx;

  if (currentTimerId !== null) clearTimeout(currentTimerId);

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation stopped");
      currentTimerId = null;
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ Showing frame ${i}`);

    i--;
    if (i < startIdx) i = stopIdx;

    currentTimerId = setTimeout(next, delay);
  }

  next();
}

// Forward playback loop between startIdx and stopIdx
function cycleFramesForwardRange(startIdx, stopIdx, delay) {
  console.log(`▶️ Playing forward from frame ${startIdx} to ${stopIdx} with delay ${delay.toFixed(1)} ms`);
  let i = startIdx;

  if (currentTimerId !== null) clearTimeout(currentTimerId);

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation stopped");
      currentTimerId = null;
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ Showing frame ${i}`);

    i++;
    if (i > stopIdx) i = startIdx;

    currentTimerId = setTimeout(next, delay);
  }

  next();
}

// Ping-Pong backward playback (start backward at stopIdx)
function cycleFramesPingPongBackwardRange(startIdx, stopIdx, delay) {
  console.log(`▶️ Ping-Pong backward between ${startIdx} and ${stopIdx} with delay ${delay.toFixed(1)} ms`);
  let i = stopIdx;
  let forward = false;

  if (currentTimerId !== null) clearTimeout(currentTimerId);

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation stopped");
      currentTimerId = null;
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ Showing frame ${i}`);

    if (forward) {
      i++;
      if (i >= stopIdx) forward = false;
    } else {
      i--;
      if (i <= startIdx) forward = true;
    }

    currentTimerId = setTimeout(next, delay);
  }

  next();
}

// Ping-Pong forward playback (start forward at startIdx)
function cycleFramesPingPongForwardRange(startIdx, stopIdx, delay) {
  console.log(`▶️ Ping-Pong forward between ${startIdx} and ${stopIdx} with delay ${delay.toFixed(1)} ms`);
  let i = startIdx;
  let forward = true;

  if (currentTimerId !== null) clearTimeout(currentTimerId);

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation stopped");
      currentTimerId = null;
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ Showing frame ${i}`);

    if (forward) {
      i++;
      if (i >= stopIdx) forward = false;
    } else {
      i--;
      if (i <= startIdx) forward = true;
    }

    currentTimerId = setTimeout(next, delay);
  }

  next();
};

document.getElementById("renameBtn").onclick = () => {
  shouldStop = false;

  if (currentTimerId !== null) {
    clearTimeout(currentTimerId);
    currentTimerId = null;
  }

  let fps = parseFloat(document.getElementById("fpsInput").value);
  if (isNaN(fps) || fps <= 0) {
    fps = 12;
    console.log("⚠️ Invalid FPS input, defaulting to 12 FPS");
  }
  const delay = 1000 / fps;

  getFrameCount((frameCount) => {
    if (frameCount === 0) {
      console.log("❌ No frames found in anim_preview.");
      return;
    }

    // Get user inputs, defaults to full range if empty or invalid
    let userStart = parseInt(document.getElementById("startFrameInput").value, 10);
    let userStop = parseInt(document.getElementById("stopFrameInput").value, 10);

    if (isNaN(userStart) || userStart < 1) userStart = 1;
    if (isNaN(userStop) || userStop > frameCount) userStop = frameCount;

    // Clamp
    userStart = clamp(userStart, 1, frameCount);
    userStop = clamp(userStop, 1, frameCount);

    if (userStart > userStop) {
      console.log(`⚠️ Start frame (${userStart}) greater than stop frame (${userStop}), swapping.`);
      [userStart, userStop] = [userStop, userStart];
    }

    const startIdx = userStart - 1;
    const stopIdx = userStop - 1;

    const reverse = document.getElementById("reverseChk").checked;
    const pingpong = document.getElementById("pingpongChk").checked;

    console.log(`▶️ Starting playback: fps=${fps}, range=[${userStart},${userStop}], reverse=${reverse}, pingpong=${pingpong}`);

    if (pingpong && reverse) {
      // Reverse + pingpong: play pingpong forward inside range (to keep playback intuitive)
      cycleFramesPingPongForwardRange(startIdx, stopIdx, delay);
    } else if (pingpong) {
      // Pingpong only: pingpong backward inside range (default direction backward)
      cycleFramesPingPongBackwardRange(startIdx, stopIdx, delay);
    } else if (reverse) {
      // Reverse only: play forward inside range
      cycleFramesForwardRange(startIdx, stopIdx, delay);
    } else {
      // Default backward full range
      cycleFramesBackwardRange(startIdx, stopIdx, delay);
    }
  });
};

document.getElementById("stopBtn").onclick = () => {
  shouldStop = true;

  if (currentTimerId !== null) {
    clearTimeout(currentTimerId);
    currentTimerId = null;
  }

  console.log("🛑 Animation stopped by user");
};
