document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) {
    console.error("❌ Button #renameBtn not found.");
    return;
  }
  
  btn.onclick = () => {
    const script = `(function () {
      try {
        var original = app.activeDocument;
        if (!original || original.layers.length === 0) {
          alert("❌ No valid layers found.");
          return;
        }

        var animGroup = null;
        for (var i = 0; i < original.layers.length; i++) {
          var layer = original.layers[i];
          if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
            animGroup = layer;
            break;
          }
        }

        if (!animGroup) {
          alert("❌ Folder 'anim_preview' not found.");
          return;
        }
        if (animGroup.layers.length === 0) {
          alert("❌ 'anim_preview' folder is empty.");
          return;
        }

        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        app.activeDocument = original;

        // Hide all anim_preview layers
        for (var i = 0; i < animGroup.layers.length; i++) {
          animGroup.layers[i].visible = false;
        }

        // Select first frame explicitly
        original.activeLayer = animGroup.layers[animGroup.layers.length - 1];
        app.refresh();

        for (var i = animGroup.layers.length - 1; i >= 0; i--) {
          var frameLayer = animGroup.layers[i];

          // Log visibility state
          var log = "\\n🔍 Layer visibility at: Before duplicating " + frameLayer.name + "\\n";
          for (var j = 0; j < animGroup.layers.length; j++) {
            log += "[" + j + "] " + animGroup.layers[j].name + " → visible=" + animGroup.layers[j].visible + "\\n";
          }
          app.echoToOE(log);

          // Toggle visibility
          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = (j === i);
          }

          app.activeDocument = tempDoc;
          while (tempDoc.layers.length > 0) {
            try { tempDoc.layers[0].remove(); } catch (e) {}
          }

          app.activeDocument = original;
          frameLayer.visible = true;
          frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

          app.activeDocument = tempDoc;

          // Fill white background
          var bg = tempDoc.artLayers.add();
          bg.name = "white_background";
          bg.move(tempDoc.layers[tempDoc.layers.length - 1], ElementPlacement.PLACEAFTER);
          app.activeDocument.activeLayer = bg;
          app.foregroundColor.rgb.red = 255;
          app.foregroundColor.rgb.green = 255;
          app.foregroundColor.rgb.blue = 255;
          app.executeAction(charIDToTypeID("Fl  "), undefined, DialogModes.NO);

          app.refresh();
          tempDoc.saveToOE("png");
        }

        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.echoToOE("✅ done");
      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent export script to Photopea");
  };

  const collectedFrames = [];
  let previewWindow = null;

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      console.log("[flipbook] 📩 Message from Photopea:\n" + event.data);

      if (event.data.includes("✅ done")) {
        if (collectedFrames.length === 0) {
          alert("❌ No frames received.");
          return;
        }

        const imageDataURLs = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return "data:image/png;base64," + btoa(binary);
        });

        previewWindow = window.open("preview.html");
        if (!previewWindow) {
          alert("❌ Could not open preview window. Please allow popups.");
          return;
        }

        const sendImages = () => {
          try {
            previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
          } catch (err) {
            console.error("❌ Failed to send frames:", err);
          }
        };

        if (previewWindow.document?.readyState === "complete") {
          sendImages();
        } else {
          previewWindow.onload = sendImages;
        }

        collectedFrames.length = 0;
      } else if (event.data.startsWith("❌")) {
        console.log("[flipbook] ⚠️ Error:", event.data);
      }
    }
  });
});
