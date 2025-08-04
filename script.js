document.addEventListener("DOMContentLoaded", function () {
  const renameBtn = document.getElementById("renameBtn");

  if (!renameBtn) {
    console.error("❌ renameBtn not found");
    return;
  }

  renameBtn.onclick = () => {
    const script = `
(function () {
  var demoFolder, layers, frameIndex = 0;

  function setOnlyLayerVisible(index) {
    for (var i = 0; i < layers.length; i++) {
      layers[i].visible = (i === index);
    }
  }

  function exportAndNotify(index) {
    app.echoToOE("[test] Frame " + (index + 1) + " visible");
    app.echoToOE("[test] ready to receive image");
    app.saveToOE("png").then(function (buf) {
      app.sendToOE(buf);
    });
  }

  function startPreview() {
    var doc = app.activeDocument;
    demoFolder = null;

    for (var i = 0; i < doc.layers.length; i++) {
      if (doc.layers[i].name === "demo" && doc.layers[i].type === "layerSection") {
        demoFolder = doc.layers[i];
        break;
      }
    }

    if (!demoFolder) {
      app.echoToOE("[test] ❌ Folder 'demo' not found.");
      return;
    }

    layers = demoFolder.layers;
    if (!layers || layers.length === 0) {
      app.echoToOE("[test] ❌ No layers inside 'demo'.");
      return;
    }

    frameIndex = 0;
    setOnlyLayerVisible(frameIndex);
    exportAndNotify(frameIndex);
  }

  window.__TEST_NEXT_FRAME = function () {
    if (!layers || !demoFolder) {
      app.echoToOE("[test] ❌ Internal error, layers not initialized.");
      return;
    }

    var currentLayer = layers[frameIndex];
    if (!currentLayer.visible) {
      app.echoToOE("[test] ❌ Current frame not visible. Retrying...");
      setOnlyLayerVisible(frameIndex);
      exportAndNotify(frameIndex);
      return;
    }

    frameIndex++;
    if (frameIndex >= layers.length) {
      app.echoToOE("[test] ✅ All frames sent.");
      return;
    }

    setOnlyLayerVisible(frameIndex);
    exportAndNotify(frameIndex);
  };

  startPreview();
})();`;

    parent.postMessage(script, "*"); // 🔥 Key difference here
  };

  // Listener to continue sending next frame
  window.addEventListener("message", function (event) {
    const data = event.data;
    if (typeof data === "string") {
      if (data === "[test] ready to receive image") {
        parent.postMessage("__TEST_NEXT_FRAME()", "*");
      } else if (data.startsWith("[test] Frame")) {
        console.log("👁️", data);
      }
    } else if (data instanceof ArrayBuffer) {
      console.log("🖼️ Got image frame", data);
      // Store in array if needed
    }
  });
});
