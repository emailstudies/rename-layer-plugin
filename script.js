document.addEventListener("DOMContentLoaded", function () {
  const renameBtn = document.getElementById("renameBtn");
  const receivedFrames = [];
  let currentFrameIndex = 0;

  function sendScriptToPhotopea(code) {
    parent.postMessage(code, "*");
  }

  function runFrame(index) {
    const script = `
(function () {
  try {
    var doc = app.activeDocument;
    if (!doc || doc.layers.length === 0) {
      app.echoToOE("[test] ❌ No valid document");
      return;
    }

    // Find the "demo" folder recursively
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

    var demoFolder = findDemoFolder(doc.layers);
    if (!demoFolder) {
      app.echoToOE("[test] ❌ Folder 'demo' not found");
      return;
    }

    var allLayers = demoFolder.layers;
    var visibleLayers = [];

    for (var i = 0; i < allLayers.length; i++) {
      var lyr = allLayers[i];
      if (lyr.typename === "ArtLayer" && !lyr.locked) {
        visibleLayers.push(lyr);
      }
    }

    if (visibleLayers.length === 0) {
      app.echoToOE("[test] ❌ No exportable layers in 'demo'");
      return;
    }

    var frameIndex = ${index};
    if (frameIndex >= visibleLayers.length) {
      app.echoToOE("[test] ✅ Done");
      return;
    }

    var current = visibleLayers[frameIndex];

    // Hide all other layers in demo
    for (var i = 0; i < visibleLayers.length; i++) {
      visibleLayers[i].visible = (i === frameIndex);
    }

    app.echoToOE("[test] Frame " + (frameIndex + 1) + " visible");

    app.runMenuItem("flatten");

    app.saveToOE("png").then(function (buf) {
      if (!buf) {
        app.echoToOE("[test] ❌ saveToOE returned null");
        return;
      }
      app.sendToOE(buf);
      app.echoToOE("[test] ready for next frame");
      app.undo(); // restore document
    });

  } catch (e) {
    app.echoToOE("[test] ❌ ERROR: " + e.message);
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

    if (typeof data === "string" && data.startsWith("[test]")) {
      console.log("📩", data);

      if (data === "[test] ready for next frame") {
        currentFrameIndex++;
        runFrame(currentFrameIndex);
      } else if (data === "[test] ✅ Done") {
        alert("✅ All frames exported: " + receivedFrames.length);
      } else if (data.startsWith("[test] ❌")) {
        alert(data);
      }
    } else if (data instanceof ArrayBuffer) {
      receivedFrames.push(data);
      console.log("🖼️ Frame", receivedFrames.length, "received (" + data.byteLength + " bytes)");
    }
  });
});
