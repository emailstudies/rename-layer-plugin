document.addEventListener("DOMContentLoaded", function () {
  const renameBtn = document.getElementById("renameBtn");
  const receivedFrames = [];
  let currentFrameIndex = 0;

  function sendScriptToPhotopea(script) {
    parent.postMessage(script, "*");
  }

  function runFrame(index) {
    const script = `
(function () {
  function findDemoFolder(layers) {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (layer.typename === "LayerSet" && layer.name === "demo") return layer;
      if (layer.typename === "LayerSet" && layer.layers) {
        var found = findDemoFolder(layer.layers);
        if (found) return found;
      }
    }
    return null;
  }

  var doc = app.activeDocument;
  var demoFolder = findDemoFolder(doc.layers);
  if (!demoFolder) {
    app.echoToOE("[test] ❌ Folder 'demo' not found");
    return;
  }

  var layers = demoFolder.layers;
  if (!layers || layers.length === 0) {
    app.echoToOE("[test] ❌ No layers in 'demo'");
    return;
  }

  var frameIndex = ${index};
  if (frameIndex >= layers.length) {
    app.echoToOE("[test] ✅ All frames exported");
    return;
  }

  for (var i = 0; i < layers.length; i++) {
    layers[i].visible = (i === frameIndex);
  }

  app.echoToOE("[test] Frame " + (frameIndex + 1) + " visible");
  app.echoToOE("[test] ready to receive image");

  app.saveToOE("png").then(function (buf) {
    app.sendToOE(buf);
  });
})();`;

    sendScriptToPhotopea(script);
  }

  renameBtn.onclick = () => {
    currentFrameIndex = 0;
    receivedFrames.length = 0;
    runFrame(currentFrameIndex);
  };

  window.addEventListener("message", function (event) {
    const data = event.data;

    if (typeof data === "string") {
      if (data.startsWith("[test]")) {
        console.log("📩", data);

        if (data === "[test] ready to receive image") {
          // wait for image, then next frame will be sent
        }
      }
    } else if (data instanceof ArrayBuffer) {
      receivedFrames.push(data);
      console.log("🖼️ Received frame", receivedFrames.length);

      currentFrameIndex++;
      runFrame(currentFrameIndex);
    }
  });
});
