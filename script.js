document.addEventListener("DOMContentLoaded", function () {
  const renameBtn = document.getElementById("renameBtn");

  if (!renameBtn) {
    console.error("❌ renameBtn not found");
    return;
  }

  // Function to safely send code string to Photopea
  function sendScriptToPhotopea(code) {
    parent.postMessage(code, "*");
  }

  // Click handler to start demo export
  renameBtn.onclick = () => {
    const script = [
      '(function () {',
      'var demoFolder, layers, frameIndex = 0;',
      'function setOnlyLayerVisible(index) {',
      '  for (var i = 0; i < layers.length; i++) {',
      '    layers[i].visible = (i === index);',
      '  }',
      '}',
      'function exportAndNotify(index) {',
      '  app.echoToOE("[test] Frame " + (index + 1) + " visible");',
      '  app.echoToOE("[test] ready to receive image");',
      '  app.saveToOE("png").then(function (buf) {',
      '    app.sendToOE(buf);',
      '  });',
      '}',
      'function startPreview() {',
      '  var doc = app.activeDocument;',
      '  demoFolder = null;',
      '  for (var i = 0; i < doc.layers.length; i++) {',
      '    if (doc.layers[i].name === "demo" && doc.layers[i].type === "layerSection") {',
      '      demoFolder = doc.layers[i]; break;',
      '    }',
      '  }',
      '  if (!demoFolder) { app.echoToOE("[test] ❌ Folder not found"); return; }',
      '  layers = demoFolder.layers;',
      '  if (!layers || layers.length === 0) { app.echoToOE("[test] ❌ No layers"); return; }',
      '  frameIndex = 0;',
      '  setOnlyLayerVisible(frameIndex);',
      '  exportAndNotify(frameIndex);',
      '}',
      'window.__TEST_NEXT_FRAME = function () {',
      '  if (!layers || !demoFolder) { app.echoToOE("[test] ❌ Internal error"); return; }',
      '  var currentLayer = layers[frameIndex];',
      '  if (!currentLayer.visible) {',
      '    app.echoToOE("[test] ❌ Retry");',
      '    setOnlyLayerVisible(frameIndex);',
      '    exportAndNotify(frameIndex);',
      '    return;',
      '  }',
      '  frameIndex++;',
      '  if (frameIndex >= layers.length) { app.echoToOE("[test] ✅ Done"); return; }',
      '  setOnlyLayerVisible(frameIndex);',
      '  exportAndNotify(frameIndex);',
      '};',
      'startPreview();',
      '})();'
    ].join("\n");

    sendScriptToPhotopea(script);
  };

  // Plugin-side listener to receive images and trigger next frame
  const receivedFrames = [];

  window.addEventListener("message", function (event) {
    const data = event.data;

    if (typeof data === "string") {
      if (data.startsWith("[test]")) {
        console.log("📩", data);

        if (data === "[test] ready to receive image") {
          parent.postMessage("__TEST_NEXT_FRAME()", "*");
        }
      }
    } else if (data instanceof ArrayBuffer) {
      receivedFrames.push(data);
      console.log("🖼️ Frame", receivedFrames.length, "received (", data.byteLength, "bytes)");
    }
  });
});
