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

  // Set only the current frame visible
  for (var i = 0; i < layers.length; i++) {
    layers[i].visible = (i === frameIndex);
  }

  app.echoToOE("[test] Frame " + (frameIndex + 1) + " visible");

  // Duplicate + flatten for safe export
  try {
    var tempDoc = app.activeDocument.duplicate();
    tempDoc.flatten();

    tempDoc.saveToOE("png").then(function (buf) {
      if (!buf) {
        app.echoToOE("[test] ❌ saveToOE failed or empty buffer");
        return;
      }
      app.sendToOE(buf);
      app.echoToOE("[test] ready for next frame");
      tempDoc.close();
    });
  } catch (e) {
    app.echoToOE("[test] ❌ Exception: " + e.message);
  }
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

        if (data === "[test] ready for next frame") {
          currentFrameIndex++;
          runFrame(currentFrameIndex);
        }
      }
    } else if (data instanceof ArrayBuffer) {
      receivedFrames.push(data);
      console.log("🖼️ Frame", receivedFrames.length, "received");
    }
  });
});
