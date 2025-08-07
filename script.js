function postScript(script) {
  parent.postMessage(script, "*");
}

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
  postScript(script);
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

  postScript(script);
}

let currentIndex = 0;
let frameCount = 0;
let playing = false;
let loopInterval = null;
let delay = 333;

function shrinkPanel() {
  parent.postMessage({ pluginResize: { width: 100, height: 60 } }, "*");
}

function expandPanel() {
  parent.postMessage({ pluginResize: { width: 400, height: 200 } }, "*");
}

function startLoopPlayback() {
  playing = true;
  currentIndex = 0;
  document.getElementById("controls").style.display = "none";
  document.getElementById("playbackControls").style.display = "flex";
  shrinkPanel();

  loopInterval = setInterval(() => {
    showOnlyFrame(currentIndex);
    currentIndex = (currentIndex + 1) % frameCount;
  }, delay);
}

function stopPlayback() {
  playing = false;
  clearInterval(loopInterval);
  document.getElementById("controls").style.display = "flex";
  document.getElementById("playbackControls").style.display = "none";
  expandPanel();
}

function showNextFrame() {
  if (!playing) return;
  showOnlyFrame(currentIndex);
  currentIndex = (currentIndex + 1) % frameCount;
}

document.getElementById("renameBtn").onclick = () => {
  let fps = parseFloat(document.getElementById("newName").value);
  if (isNaN(fps) || fps <= 0) fps = 3;
  delay = 1000 / fps;

  getFrameCount((count) => {
    frameCount = count;
    if (frameCount > 0) {
      startLoopPlayback();
    }
  });
};

document.getElementById("stopBtn").onclick = stopPlayback;
document.getElementById("nextBtn").onclick = showNextFrame;
