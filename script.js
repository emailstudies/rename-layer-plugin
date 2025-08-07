let interval = null;
let currentIndex = 0;
let totalFrames = 0; 

// Show one frame in Photopea
function showOnlyFrame(index) {
  const script = `
    (function () {
      var doc = app.activeDocument;
      var animGroup = null;
      for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
          animGroup = layer;
        } else {
          layer.visible = false;
        }
      }
      if (!animGroup) return;

      animGroup.visible = true;
      for (var i = 0; i < animGroup.layers.length; i++) {
        animGroup.layers[i].visible = false;
      }

      if (${index} < animGroup.layers.length) {
        animGroup.layers[${index}].visible = true;
      }
    })();`;
  parent.postMessage(script, "*");
}

// Get number of frames in anim_preview
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
      if (animGroup) {
        app.echoToOE("✅ count " + animGroup.layers.length);
      } else {
        app.echoToOE("❌ anim_preview not found");
      }
    })();`;

  function handleCount(event) {
    if (typeof event.data === "string" && event.data.startsWith("✅ count")) {
      window.removeEventListener("message", handleCount);
      const count = parseInt(event.data.split(" ")[2], 10);
      callback(count);
    }
  }

  window.addEventListener("message", handleCount);
  parent.postMessage(script, "*");
}

// Start looping animation
function startPlayback(fps) {
  const delay = 1000 / fps;
  interval = setInterval(() => {
    showOnlyFrame(currentIndex % totalFrames);
    currentIndex++;
  }, delay);
}

// Stop animation
function stopPlayback() {
  clearInterval(interval);
  interval = null;
  currentIndex = 0;
}

// Shrink the iframe panel
function shrinkIframe() {
  try {
    if (window.frameElement) {
      window.frameElement.style.width = "100px";
      window.frameElement.style.height = "40px";
    }
  } catch (e) {}
}

// Expand the iframe panel
function expandIframe() {
  try {
    if (window.frameElement) {
      window.frameElement.style.width = "400px";
      window.frameElement.style.height = "200px";
    }
  } catch (e) {}
}

// DOM
document.getElementById("renameBtn").onclick = () => {
  const fpsInput = parseFloat(document.getElementById("newName").value);
  const fps = isNaN(fpsInput) || fpsInput <= 0 ? 3 : fpsInput;

  getFrameCount((count) => {
    if (count > 0) {
      totalFrames = count;
      currentIndex = 0;

      // UI switch
      document.getElementById("mainUI").classList.remove("active");
      document.getElementById("playbackUI").classList.add("active");

      shrinkIframe();
      startPlayback(fps);
    }
  });
};

document.getElementById("stopBtn").onclick = () => {
  stopPlayback();
  expandIframe();

  document.getElementById("mainUI").classList.add("active");
  document.getElementById("playbackUI").classList.remove("active");
};

document.getElementById("nextBtn").onclick = () => {
  showOnlyFrame(currentIndex % totalFrames);
  currentIndex++;
};
