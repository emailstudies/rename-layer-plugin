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

// Normal forward playback: 0 → 1 → 2 → ... → N-1 → repeat
function cycleFramesForward(total, delay) {
  console.log(`▶️ cycleFramesForward playing frames 0 to ${total - 1} with delay ${delay.toFixed(1)} ms`);
  let i = 0;

  if (currentTimerId !== null) clearTimeout(currentTimerId);

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation stopped");
      currentTimerId = null;
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ Showing frame ${i}`);

    i = (i + 1) % total;
    currentTimerId = setTimeout(next, delay);
  }

  next();
}

// Reverse playback: N-1 → ... → 2 → 1 → 0 → repeat
function cycleFramesReverse(total, delay) {
  console.log(`▶️ cycleFramesReverse playing frames ${total - 1} down to 0 with delay ${delay.toFixed(1)} ms`);
  let i = total - 1;

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
    if (i < 0) i = total - 1;

    currentTimerId = setTimeout(next, delay);
  }

  next();
}

// Ping-Pong playback: 0 → 1 → ... → N-1 → N-2 → ... → 1 → 0 → repeat
function cycleFramesPingPong(total, delay) {
  console.log(`▶️ cycleFramesPingPong playing frames 0→${total - 1}→0 ping-pong with delay ${delay.toFixed(1)} ms`);
  let i = 0;
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
      if (i >= total - 1) forward = false;
    } else {
      i--;
      if (i <= 0) forward = true;
    }

    currentTimerId = setTimeout(next, delay);
  }

  next();
}

// Reverse + Ping-Pong playback: N-1 → N-2 → ... → 0 → 1 → ... → N-1 → repeat
function cycleFramesPingPongReverse(total, delay) {
  console.log(`▶️ cycleFramesPingPongReverse playing frames ${total - 1}→0→${total - 1} ping-pong reversed with delay ${delay.toFixed(1)} ms`);
  let i = total - 1;
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
      if (i >= total - 1) forward = false;
    } else {
      i--;
      if (i <= 0) forward = true;
    }

    currentTimerId = setTimeout(next, delay);
  }

  next();
}

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

    const reverse = document.getElementById("reverseChk").checked;
    const pingpong = document.getElementById("pingpongChk").checked;

    console.log(`▶️ Starting playback with fps=${fps}, reverse=${reverse}, pingpong=${pingpong}`);

    if (pingpong && reverse) {
      cycleFramesPingPongReverse(frameCount, delay);
    } else if (pingpong) {
      cycleFramesPingPong(frameCount, delay);
    } else if (reverse) {
      cycleFramesReverse(frameCount, delay);
    } else {
      cycleFramesForward(frameCount, delay);
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
