let shouldStop = false;

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

function cycleFrames(total, delay = 1000 / 12) {
  console.log(`▶️ cycleFrames playing full animation with total=${total}, delay=${delay.toFixed(1)}ms`);
  let i = total - 1;

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation loop stopped.");
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ cycleFrames showing frame index: ${i}`);
    i--;
    if (i < 0) i = total - 1; // loop back to end

    setTimeout(next, delay);
  }

  next();
}

function cycleFramesRange(start, stop, delay = 1000 / 12) {
  console.log(`▶️ cycleFramesRange playing frames from ${start} to ${stop}, delay=${delay.toFixed(1)}ms`);
  let i = stop - 1;
  const startIndex = start - 1;

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation loop stopped.");
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ cycleFramesRange showing frame index: ${i}`);
    i--;
    if (i < startIndex) i = stop - 1;

    setTimeout(next, delay);
  }

  next();
}

function setDefaultStartStop() {
  getFrameCount((frameCount) => {
    const startInput = document.getElementById("startFrameInput");
    const stopInput = document.getElementById("stopFrameInput");

    startInput.min = 1;
    stopInput.min = 1;
    stopInput.max = frameCount;

    if (!startInput.value || startInput.value < 1) startInput.value = 1;
    if (!stopInput.value || stopInput.value > frameCount) stopInput.value = frameCount;

    console.log(`⚙️ Default Start set to 1 and Stop set to ${frameCount}`);
  });
}

document.getElementById("renameBtn").onclick = () => {
  shouldStop = false;

  let fps = parseFloat(document.getElementById("fpsInput").value);
  if (isNaN(fps) || fps <= 0) {
    fps = 12;
    console.log("⚠️ Invalid FPS input, defaulting to 12 FPS");
  }
  const delay = 1000 / fps;

  getFrameCount((frameCount) => {
    if (frameCount > 0) {
      const startInput = document.getElementById("startFrameInput");
      const stopInput = document.getElementById("stopFrameInput");

      startInput.min = 1;
      stopInput.min = 1;
      stopInput.max = frameCount;

      let start = parseInt(startInput.value, 10);
      let stop = parseInt(stopInput.value, 10);

      if (isNaN(start) || start < 1) start = 1;
      if (isNaN(stop) || stop > frameCount) stop = frameCount;
      if (stop < start) {
        console.log("⚠️ Stop frame less than start frame, adjusting stop to start.");
        stop = start;
      }

      startInput.value = start;
      stopInput.value = stop;

      console.log(`▶️ Playing from frame ${start} to ${stop} at ${fps} FPS`);

      if (start === 1 && stop === frameCount) {
        cycleFrames(frameCount, delay);
      } else {
        cycleFramesRange(start, stop, delay);
      }
    } else {
      console.log("❌ No frames found in anim_preview.");
    }
  });
};

document.getElementById("stopBtn").onclick = () => {
  shouldStop = true;
  console.log("🛑 User requested to stop animation");
};

window.addEventListener("DOMContentLoaded", () => {
  setDefaultStartStop();
});
