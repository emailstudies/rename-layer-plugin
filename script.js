let interval = null;

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
        window.removeEventListener("message", handleCount);
        callback(count);
      }
    }
  });

  parent.postMessage(script, "*");
}

function cycleFrames(total, delay) {
  let index = 0;

  clearInterval(interval);
  interval = setInterval(() => {
    showOnlyFrame(index);
    index = (index + 1) % total;
  }, delay);
}

function stopAnimation() {
  clearInterval(interval);
  toggleUI(false);
}

function toggleUI(isPlaying) {
  const controls = document.getElementById("controls");
  const stopBtn = document.getElementById("stopBtn");
  const iframeWrapper = window.frameElement?.parentElement?.parentElement?.parentElement;

  if (isPlaying) {
    controls.classList.add("compact");
    stopBtn.style.display = "inline";

    // Resize iframe container
    if (iframeWrapper) {
      iframeWrapper.style.width = "100px";
      iframeWrapper.style.height = "50px";
    }
  } else {
    controls.classList.remove("compact");
    stopBtn.style.display = "none";

    // Restore iframe container size
    if (iframeWrapper) {
      iframeWrapper.style.width = "389px";
      iframeWrapper.style.height = "310px";
    }
  }
}

document.getElementById("renameBtn").onclick = () => {
  let fps = parseFloat(document.getElementById("newName").value);
  if (isNaN(fps) || fps <= 0) fps = 3;
  const delay = 1000 / fps;

  console.log("🎞️ FPS:", fps, "→ Delay:", delay.toFixed(1), "ms");

  getFrameCount((frameCount) => {
    if (frameCount > 0) {
      toggleUI(true);
      cycleFrames(frameCount, delay);
    } else {
      console.log("No frames found in anim_preview.");
    }
  });
};

document.getElementById("stopBtn").onclick = stopAnimation;
