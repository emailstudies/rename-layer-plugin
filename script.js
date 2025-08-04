document.addEventListener("DOMContentLoaded", function () {
  const renameBtn = document.getElementById("renameBtn");

  const receivedFrames = [];
  let currentFrameIndex = 0;
  let totalFrames = 0;

  function sendScriptToPhotopea(code) {
    parent.postMessage(code, "*");
  }

  function runFrame(index) {
    const script = `
      (function () {
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

        var doc = app.activeDocument;
        var demoFolder = findDemoFolder(doc.layers);
        if (!demoFolder) {
          app.echoToOE("[test] ❌ Folder not found");
          return;
        }

        var layers = demoFolder.layers;
        if (!layers || layers.length === 0) {
          app.echoToOE("[test] ❌ No layers in demo");
          return;
        }

        var total = layers.length;
        var index = ${index};

        for (var i = 0; i < layers.length; i++) {
          layers[i].visible = (i === index);
        }

        app.echoToOE("[test] Frame " + (index + 1) + " visible");
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
          parent.postMessage("// plugin: ready for image", "*");
          // no need to send back __TEST_NEXT_FRAME
          // wait for image and trigger next after receiving it
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
