document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #renameBtn not found");
    return;
  }

  const collectedFrames = [];
  let imageDataURLs = [];
  let previewWindow = null;

  if (window.__flipbookMessageListener__) {
    window.removeEventListener("message", window.__flipbookMessageListener__);
  }

  const handleMessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      return;
    }

    if (typeof event.data === "string") {
      if (event.data.trim().startsWith("{") && event.data.includes("Photopea")) return;

      if (event.data === "✅ done") {
        console.log("[flipbook] ✅ All frames received.");
        if (collectedFrames.length === 0) {
          alert("❌ No frames received.");
          return;
        }

        imageDataURLs = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return "data:image/png;base64," + btoa(binary);
        });

        if (previewWindow && previewWindow.postMessage) {
          previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
        }

        collectedFrames.length = 0;
      } else if (event.data.startsWith("❌")) {
        console.warn("[flipbook] ⚠️", event.data);
      } else {
        console.log("[flipbook] ℹ️ Message:", event.data);
      }
    }
  };

  window.addEventListener("message", handleMessage);
  window.__flipbookMessageListener__ = handleMessage;

  btn.onclick = () => {
    previewWindow = window.open("preview.html");

    if (!previewWindow) {
      alert("❌ Could not open preview window. Please allow popups.");
      return;
    }

    collectedFrames.length = 0;

    const script = `(function () {
      try {
        var original = app.activeDocument;
        if (!original || original.layers.length === 0) {
          app.echoToOE("❌ No valid layers found.");
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
          app.echoToOE("❌ Folder 'anim_preview' not found.");
          return;
        }

        if (animGroup.layers.length === 0) {
          app.echoToOE("❌ 'anim_preview' folder is empty.");
          return;
        }

        var tempDoc = app.documents.add(
          original.width,
          original.height,
          original.resolution,
          "_temp_export",
          NewDocumentMode.RGB,
          DocumentFill.TRANSPARENT
        );

        for (var i = animGroup.layers.length - 1; i >= 0; i--) {
          var frameLayer = animGroup.layers[i];
          if (frameLayer.name === "Background" && frameLayer.locked) continue;

          // 🔁 Remove all layers from tempDoc
          app.activeDocument = tempDoc;
          var cleared = 0;
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            try {
              tempDoc.layers[j].remove();
              cleared++;
            } catch (e) {}
          }

          app.refresh(); // 🟢 AFTER REMOVAL
          app.echoToOE("🧹 Cleared " + cleared + " layers in temp doc.");

          app.activeDocument = original;

          // 🔒 Hide all layers first
          for (var k = 0; k < animGroup.layers.length; k++) {
            animGroup.layers[k].visible = false;
          }

          animGroup.visible = true;
          frameLayer.visible = true;
          original.activeLayer = frameLayer;

          app.refresh(); // 🟢 BEFORE DUPLICATION

          // 🔁 Duplicate current frame
          frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);
          app.echoToOE("📸 Exporting frame: " + frameLayer.name);

          app.activeDocument = tempDoc;

          // ✅ Confirm only one visible layer in tempDoc
          var visibleCount = 0;
          for (var m = 0; m < tempDoc.layers.length; m++) {
            if (tempDoc.layers[m].visible) visibleCount++;
          }

          if (visibleCount !== 1) {
            app.echoToOE("⚠️ Warning: " + visibleCount + " visible layers in tempDoc.");
          }

          app.refresh();
          tempDoc.saveToOE("png");
        }

        app.activeDocument = tempDoc;
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.echoToOE("✅ done");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent export script to Photopea");
  };
});
