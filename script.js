let shouldStop = false;

function toggleUI(isPlaying) {
  document.getElementById("newName").style.display = isPlaying ? "none" : "inline";
  document.getElementById("renameBtn").style.display = isPlaying ? "none" : "inline";
  document.getElementById("stopBtn").style.display = isPlaying ? "inline" : "none";
}

function showOnlyFrame(index) {
  const script = `
    (function () {
      var doc = app.activeDocument;
      var animGroup = null;
      var bgLayer = null;

      // Identify 'anim_preview' and 'Background' layers
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

function cycleFrames(total, delay = 300) {
  let i = total - 1;

  function next() {
    if (shouldStop) {
      toggleUI(false);
      return;
    }
    showOnlyFrame(i);
    i--;
    if (i < 0) i = total - 1;
    setTimeout(next, delay);
  }

  next();
}

// ▶️ Play button
document.getElementById("renameBtn").onclick = () => {
  shouldStop = false;
  toggleUI(true);

  let fps = parseFloat(document.getElementById("newName").value);
  if (isNaN(fps) || fps <= 0) {
    fps = 3;
  }
  const delay = 1000 / fps;

  console.log("🎞️ Using FPS:", fps, "→ Delay:", delay.toFixed(1), "ms");

  getFrameCount((frameCount) => {
    if (frameCount > 0) {
      cycleFrames(frameCount, delay);
    } else {
      console.log("No frames found in anim_preview.");
      toggleUI(false);
    }
  });
};

// ⏹️ Stop button
document.getElementById("stopBtn").onclick = () => {
  shouldStop = true;
  toggleUI(false);
};
