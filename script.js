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
    var original = app.activeDocument;
    if (!original || original.layers.length === 0) {
      app.echoToOE("[test] ❌ No valid layers.");
      return;
    }

    // Recursively find the "demo" folder
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

    var demoFolder = findDemoFolder(original.layers);
    if (!demoFolder) {
      app.echoToOE("[test] ❌ 'demo' folder not found.");
      return;
    }

    // Filter valid, visible, unlocked ArtLayers only
    var validLayers = [];
    for (var i = 0; i < demoFolder.layers.length; i++) {
      var lyr = demoFolder.layers[i];
      if (lyr.typename === "ArtLayer" && lyr.visible && !lyr.locked) {
        validLayers.push(lyr);
      }
    }

    if (validLayers.length === 0) {
      app.echoToOE("[test] ❌ No valid visible layers in 'demo'");
      return;
    }

    var frameIndex = ${index};
    if (frameIndex >= validLayers.length) {
      app.echoToOE("[test] ✅ Done");
      return;
    }

    var layer = validLayers[frameIndex];
    app.echoToOE("[test] Frame " + (frameIndex + 1) + " visible");

    // Create new blank temp doc
    var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);

    app.activeDocument = original;
    original.activeLayer = layer;
    layer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

    app.activeDocument = tempDoc;
    tempDoc.flatten();

    tempDoc.saveToOE("png").then(function (buf) {
      if (buf) {
        app.sendToOE(buf);
        app.echoToOE("[test] ready for next frame");
      } else {
        app.echoToOE("[test] ❌ saveToOE returned null");
      }
      tempDoc.close(SaveOptions.DONOTSAVECHANGES);
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
      } else if (data.startsWith("[test] ❌")) {
        alert(data);
      } else if (data === "[test] ✅ Done") {
        alert("✅ All frames exported: " + receivedFrames.length);
      }
    } else if (data instanceof ArrayBuffer) {
      receivedFrames.push(data);
      console.log("🖼️ Frame", receivedFrames.length, "received (" + data.byteLength + " bytes)");
    }
  });
});
