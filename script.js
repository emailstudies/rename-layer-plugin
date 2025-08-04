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
    function getLayerByName(name) {
      var doc = app.activeDocument;
      for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.typename === "LayerSet" && layer.name === name) return layer;
      }
      return null;
    }

    function getLayerIDsFromGroup(group) {
      var ids = [];
      for (var i = 0; i < group.layers.length; i++) {
        var layer = group.layers[i];
        if (layer.typename === "ArtLayer") {
          var desc = new ActionReference();
          desc.putIndex(charIDToTypeID("Lyr "), group.layers.length - i); // top-down
          var result = executeActionGet(desc);
          ids.push(result.getInteger(stringIDToTypeID("layerID")));
        }
      }
      return ids;
    }

    function selectLayerById(id) {
      var ref = new ActionReference();
      ref.putIdentifier(charIDToTypeID("Lyr "), id);
      var desc = new ActionDescriptor();
      desc.putReference(charIDToTypeID("null"), ref);
      desc.putBoolean(charIDToTypeID("MkVs"), false);
      executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
    }

    function setVisibilityById(id, visible) {
      var ref = new ActionReference();
      ref.putIdentifier(charIDToTypeID("Lyr "), id);
      var desc = new ActionDescriptor();
      desc.putReference(charIDToTypeID("null"), ref);
      desc.putBoolean(charIDToTypeID("Vsbl"), visible);
      executeAction(charIDToTypeID("hide") + (visible ? "Shw" : ""), desc, DialogModes.NO);
    }

    var frameIndex = ${index};
    var group = getLayerByName("demo");
    if (!group) { app.echoToOE("[test] ❌ 'demo' LayerSet not found"); return; }

    var ids = getLayerIDsFromGroup(group);
    if (frameIndex >= ids.length) {
      app.echoToOE("[test] ✅ Done");
      return;
    }

    // First hide all
    for (var i = 0; i < ids.length; i++) {
      setVisibilityById(ids[i], false);
    }

    // Show only current
    setVisibilityById(ids[frameIndex], true);
    selectLayerById(ids[frameIndex]);

    app.echoToOE("[test] Frame " + (frameIndex + 1) + " visible");

    app.runMenuItem("flatten");

    app.saveToOE("png").then(function (buf) {
      if (buf) {
        app.sendToOE(buf);
        app.echoToOE("[test] ready for next frame");
      } else {
        app.echoToOE("[test] ❌ Export failed");
      }
      app.undo(); // undo flatten
    });

  } catch (e) {
    app.echoToOE("[test] ❌ Error: " + e.message);
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
