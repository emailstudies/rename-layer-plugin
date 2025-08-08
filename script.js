let shouldStop = false;
let currentTimerId = null; 

/**
 * showOnlyFrame
 * -----------------
 * Sends a script to Photopea to show only the frame (layer) at the given zero-based index
 * within the 'anim_preview' group, hiding all other frames but keeping background visible.
 * 
 * @param {number} index - zero-based layer index to show
 */
function showOnlyFrame(index) {
  const script = `
    (function () { 
      var doc = app.activeDocument;
      var animGroup = null;
      var bgLayer = null;

      // Find anim_preview group and background layer
      for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
          animGroup = layer;
        } else if (layer.name.toLowerCase() === "background") {
          bgLayer = layer;
        } else {
          layer.visible = false; // Hide all other top-level layers
        }
      }

      if (!animGroup) {
        app.echoToOE("❌ 'anim_preview' not found.");
        return;
      }

      animGroup.visible = true;
      if (bgLayer) bgLayer.visible = true;

      // Hide all frames in anim_preview
      for (var i = 0; i < animGroup.layers.length; i++) {
        animGroup.layers[i].visible = false;
      }

      // Show only requested frame if valid index
      if (${index} >= 0 && ${index} < animGroup.layers.length) {
        animGroup.layers[${index}].visible = true;
        app.echoToOE("👁️ Showing frame ${index}");
      }
    })();
  `;

  parent.postMessage(script, "*");
}

/**
 * getFrameCount
 * -----------------
 * Queries Photopea for the number of frames (layers) inside 'anim_preview'.
 * Calls the callback with the frame count once received.
 * 
 * @param {function} callback - called with frame count (number)
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

/**
 * clearTimer
 * -----------------
 * Clears any existing playback timer to avoid overlapping loops.
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
 * Plays the full animation cycling through all frames, with options for direction and ping-pong.
 * Frames are indexed zero-based top to bottom (0 = top layer, n-1 = bottom layer).
 * 
 * @param {number} total - total frames in anim_preview
 * @param {number} delay - delay in milliseconds between frames
 * @param {boolean} reverse - play frames in reverse (bottom to top)
 * @param {boolean} pingpong - enable ping-pong playback (back and forth)
 */
function cycleFrames(total, delay, reverse, pingpong) {
  console.log(`▶️ cycleFrames playing full animation total=${total}, delay=${delay}ms, reverse=${reverse}, pingpong=${pingpong}`);

  // Determine start index and direction considering Photopea layer order
  let i = reverse ? 0 : total - 1;
  let direction = reverse ? 1 : -1; // reverse plays bottom to top (index ascending)
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

/**
 * cycleFramesRange
 * -----------------
 * Plays animation looping between a range of frames [start, stop] specified by the user,
 * considering Photopea’s reversed layer indexing.
 * Supports reverse and ping-pong playback.
 * 
 * @param {number} start - 1-based user start frame number (bottom = 1)
 * @param {number} stop - 1-based user stop frame number
 * @param {number} delay - delay in ms between frames
 * @param {boolean} reverse - true to reverse playback direction
 * @param {boolean} pingpong - enable ping-pong playback
 * @param {number} frameCount - total frames in anim_preview (needed for index conversion)
 */
function cycleFramesRange(start, stop, delay, reverse, pingpong, frameCount) {
  console.log(`▶️ cycleFramesRange playing frames from ${start} to ${stop}, delay=${delay}ms, reverse=${reverse}, pingpong=${pingpong}`);

  // Convert user 1-based frame numbers to Photopea zero-based indices (top=0, bottom=n-1)
  let startIndex = frameCount - start;
  let stopIndex = frameCount - stop;

  // Make sure startIndex >= stopIndex because layers are top-down
  if (startIndex < stopIndex) {
    [startIndex, stopIndex] = [stopIndex, startIndex];
  }

  // Determine initial frame index and direction
  let i = reverse ? stopIndex : startIndex;
  let direction = reverse ? 1 : -1; // direction follows layer index order
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

// Play button event handler: get frame count, parse inputs, start animation
document.getElementById("renameBtn").onclick = () => {
  shouldStop = false;

  getFrameCount((frameCount) => {
    if (frameCount <= 0) {
      console.log("❌ No frames found in anim_preview.");
      return;
    }

    // Parse start and stop inputs; default to full range if empty or invalid
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
};

// Stop button event handler: stop animation playback
document.getElementById("stopBtn").onclick = () => {
  shouldStop = true;
  clearTimer();
  console.log("🛑 Animation stopped by user");
};
