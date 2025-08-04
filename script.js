document.addEventListener("DOMContentLoaded", function () {
  const renameBtn = document.getElementById("renameBtn");

  if (!renameBtn) {
    console.error("❌ renameBtn not found");
    return;
  }

  const receivedFrames = [];

  function sendScriptToPhotopea(code) {
    parent.postMessage(code, "*");
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

  function findDemoFolder(layers) {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (layer.name === "demo" && layer.type === "layerSection") return layer;
      if (layer.type === "layerSection" && layer.layers) {
        var found = findDemoFolder(layer.layers);
        if (found) return found;
      }
    }
    return null;
  }

  function startPreview() {
    var doc = app.activeDocument;
    demoFolder = findDemoFolder(doc.layers);
    if (!demoFolder) {
      app.echoToOE("[test] ❌ Folder not found");
      return;
    }

    layers = demoFolder.layers;
    if (!layers || layers.length === 0) {
      app.echoToOE("[test] ❌ No layers in demo");
      return;
    }

    frameIndex = 0;
    setOnlyLayerVisible(frameIndex);
    exportAndNotify(frameIndex);
  }

  app.defineCommand("next_demo_frame", function () {
    if (!layers || !demoFolder) {
      app.echoToOE("[test] ❌ Internal error");
      return;
    }

    var currentLayer = layers[frameIndex];
    if (!currentLayer.visible) {
      app.echoToOE("[test] ❌ Frame not visible, retrying");
      setOnlyLayerVisible(frameIndex);
      exportAndNotify(frameIndex);
      return;
    }

    frameIndex++;
    if (frameIndex >= layers.length) {
      app.echoToOE("[test] ✅ All frames sent");
      return;
    }

    setOnlyLayerVisible(frameIndex);
    exportAndNotify(frameIndex);
  });

  startPreview();
})();`;

    sendScriptToPhotopea(script);
  };

  // Plugin-side listener
  window.addEventListener("message", function (event) {
    const data = event.data;

    if (typeof data === "string") {
      if (data.startsWith("[test]")) {
        console.log("📩", data);

        if (data === "[test] ready to receive image") {
          // Call the Photopea-side command to show next frame
          parent.postMessage("app.runCommand('next_demo_frame')", "*");
        }
      }
    } else if (data instanceof ArrayBuffer) {
      receivedFrames.push(data);
      console.log("🖼️ Received frame", receivedFrames.length, "(", data.byteLength, "bytes)");
    }
  });
});
