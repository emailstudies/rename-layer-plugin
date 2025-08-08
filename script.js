let shouldStop = false;
let currentTimerId = null;

/**
 * showOnlyFrame
 * -----------------
 * Sends a script to Photopea to show only the frame (layer) at the given index
 * within the 'anim_preview' group, hiding all others and keeping background visible.
 * 
 * @param {number} index - zero-based index of the frame to show
 */
function showOnlyFrame(index) {
  const script = `
    (function () {
      var doc = app.activeDocument;
      var animGroup = null;
      var bgLayer = null;

      // Find the 'anim_preview' group and 'background' layer among top-level layers
      for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
          animGroup = layer;
        } else if (layer.name.toLowerCase() === "background") {
          bgLayer = layer;
        } else {
          layer.visible = false; // hide all other top-level layers
        }
      }

      if (!animGroup) {
        app.echoToOE("❌ 'anim_preview' not found.");
        return;
      }

      animGroup.visible = true;
      if (bgLayer) bgLayer.visible = true;

      // Hide all frames initially
      for (var i = 0; i < animGroup.layers.length; i++) {
        animGroup.layers[i].visible = false;
      }

      // Show only the requested frame if in range
      if (${index} < animGroup.layers.length) {
        animGroup.layers[${index}].visible = true;
        app.echoToOE("👁️ Showing frame ${index}");
      }
    })();`;

  parent.postMessage(script, "*");
}

/**
 * getFrameCount
 * -----------------
 * Queries Photopea for the number of frames (layers) inside 'anim_preview'.
 * Calls the provided callback with the frame count once received.
 * 
 * @param {function} callback - function to call with frame count (number)
 */
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

  // Listen once for the response containing frame count
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

/**
 * clearTimer
 * -----------------
 * Helper to clear any existing playback timer to prevent multiple overlapping loops.
 */
function clearTimer() {
  if (currentTimerId !== null) {
    clearTimeout(currentTimerId);
    currentTimerId = null;
  }
}

/**
 * cycleFrames
 * -----------------
 * Plays the full animation cycling through all frames, either forward or reverse,
 * with optional ping-pong (back and forth) playback.
 * Loops continuously until stopped.
 * 
 * @param {number} total - total number of frames
 * @param {number} delay - delay in milliseconds between frames
 * @param {boolean} reverse - true to play frames in reverse order
 * @param {boolean} pingpong - true to play back and forth (ping-pong)
 */
function cycleFrames(total, delay, reverse, pingpong) {
  console.log(`▶️ cycleFrames playing full animation total=${total}, delay=${delay}ms, reverse=${reverse}, pingpong=${pingpong}`);

  let i = reverse ? total - 1 : 0;
  let direction = reverse ? -1 : 1;
  let goingForward = true;

  clearTimer();
  shouldStop = false;

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation loop stopped.");
      clearTimer();
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ Showing frame index: ${i}`);

    if (pingpong) {
      if (goingForward) {
        i += direction;
        if (i >= total) {
          i = total - 2;
          goingForward = false;
        } else if (i < 0) {
          i = 1;
          goingForward = true;
        }
      } else {
        i -= direction;
        if (i < 0) {
          i = 1;
          goingForward = true;
        } else if (i >= total) {
          i = total - 2;
          goingForward = false;
        }
      }
    } else {
      i += direction;
      if (reverse) {
        if (i < 0) i = total - 1;
      } else {
        if (i >= total) i = 0;
      }
    }

    currentTimerId = setTimeout(next, delay);
  }

  next();
}

/**
 * cycleFramesRange
 * -----------------
 * Plays animation looping between a range of frames [start, stop], either forward or reverse,
 * with optional ping-pong playback.
 * Frames are 1-based in UI, converted internally to 0-based index.
 * 
 * @param {number} start - start frame number (1-based)
 * @param {number} stop - stop frame number (1-based)
 * @param {number} delay - delay in ms between frames
 * @param {boolean} reverse - play frames in reverse order
 * @param {boolean} pingpong - enable ping-pong playback
 */
function cycleFramesRange(start, stop, delay, reverse, pingpong) {
  console.log(`▶️ cycleFramesRange playing frames from ${start} to ${stop}, delay=${delay}ms, reverse=${reverse}, pingpong=${pingpong}`);

  const startIndex = start - 1;
  const stopIndex = stop - 1;
  let i = reverse ? stopIndex : startIndex;
  let direction = reverse ? -1 : 1;
  let goingForward = true;

  clearTimer();
  shouldStop = false;

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation loop stopped.");
      clearTimer();
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ Showing frame index: ${i}`);

    if (pingpong) {
      if (goingForward) {
        i += direction;
        if (i > stopIndex) {
          i = stopIndex - 1;
          goingForward = false;
        } else if (i < startIndex) {
          i = startIndex + 1;
          goingForward = true;
        }
      } else {
        i -= direction;
        if (i < startIndex) {
          i = startIndex + 1;
          goingForward = true;
        } else if (i > stopIndex) {
          i = stopIndex - 1;
          goingForward = false;
        }
      }
    } else {
      i += direction;
      if (reverse) {
        if (i < startIndex) i = stopIndex;
      } else {
        if (i > stopIndex) i = startIndex;
      }
    }

    currentTimerId = setTimeout(next, delay);
  }

  next();
}

// Play button handler: fetch frame count and start appropriate playback
document.getElementById("renameBtn").onclick = () => {
  shouldStop = false;

  getFrameCount((frameCount) => {
    if (frameCount <= 0) {
      console.log("No frames found in anim_preview.");
      return;
    }

    const startInput = document.getElementById("startFrameInput").value.trim();
    const stopInput = document.getElementById("stopFrameInput").value.trim();

    let start = parseInt(startInput, 10);
    let stop = parseInt(stopInput, 10);

    // Default to entire range if inputs empty or invalid
    if (isNaN(start) || start < 1) start = 1;
    if (isNaN(stop) || stop > frameCount) stop = frameCount;

    if (start > stop) {
      alert("Start frame cannot be greater than Stop frame.");
      return;
    }

    const delay = getSelectedDelay();

    const reverse = document.getElementById("reverseChk").checked;
    const pingpong = document.getElementById("pingpongChk").checked;

    if (start === 1 && stop === frameCount) {
      cycleFrames(frameCount, delay, reverse, pingpong);
    } else {
      cycleFramesRange(start, stop, delay, reverse, pingpong);
    }
  });
};

// Stop button handler: stop animation playback
document.getElementById("stopBtn").onclick = () => {
  shouldStop = true;
  clearTimer();
};
