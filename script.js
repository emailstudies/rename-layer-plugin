document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #renameBtn not found");
    return;
  }

  const collectedFrames = [];
  let imageDataURLs = [];
  let previewWindow = null;
  let currentFrameIndex = 0;
  let totalFrames = 0;

  if (window.__flipbookMessageListener__) {
    window.removeEventListener("message", window.__flipbookMessageListener__);
  }

  // ✅ Function to export single frame at given index
  function exportFrameAt(index) {
    const script = `
      (function () {
        try {
          var doc = app.activeDocument;
          var animGroup = null;

          for (var i = 0; i < doc.layers.length; i++) {
            var layer = doc.layers[i];
            if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
              animGroup = layer;
              break;
            }
          }

          if (!animGroup) {
            app.echoToOE("❌ Folder 'anim_preview' not found.");
            return;
          }

          for (var i = 0; i < doc.layers.length; i++) {
            doc.layers[i].visible = false;
          }
          for (var i = 0; i < animGroup.layers.length; i++) {
            animGroup.layers[i].visible = false;
          }

          if (${index} < animGroup.layers.length) {
            var frameLayer = animGroup.layers[${index}];
            animGroup.visible = true;
            frameLayer.visible = true;
            doc.activeLayer = frameLayer;
            app.refresh();
            doc.saveToOE("png");
          }
        } catch (e) {
          app.echoToOE("❌ ERROR: " + e.message);
        }
      })();`;

    parent.postMessage(script, "*");
    console.log(`[flipbook] ⏭️ Exporting frame ${index + 1}`);
  }

  // ✅ Message listener from Photopea + preview.html
  const handleMessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      return;
    }

    if (typeof event.data === "string") {
      if (event.data.trim().startsWith("{") && event.data.includes("Photopea")) {
        return;
      }

      // Preview window is ready
      else if (event.data.startsWith("✅ ready")) {
        const count = parseInt(event.data.split(" ")[2], 10);
        if (!isNaN(count)) {
          totalFrames = count;
          currentFrameIndex = 0;
          collectedFrames.length = 0;
          console.log(`[flipbook] 🟢 Ready to export ${totalFrames} frames`);
          previewWindow?.postMessage("✅ next", "*");
        }
      }

      // Preview window wants the next frame
      else if (event.data === "✅ next") {
        if (currentFrameIndex < totalFrames) {
          exportFrameAt(currentFrameIndex);
          currentFrameIndex++;
        } else {
          parent.postMessage(`app.echoToOE("✅ done")`, "*");
        }
      }

      // All exports done, send images to preview
      else if (event.data === "✅ done") {
        console.log("[flipbook] ✅ All frames received.");

        imageDataURLs = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return "data:image/png;base64," + btoa(binary);
        });

        if (previewWindow && previewWindow.postMessage) {
          previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
        }

        collectedFrames.length = 0;
      }

      else if (event.data.startsWith("❌")) {
        console.warn("[flipbook] ⚠️", event.data);
      }

      else {
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

    const script = `
      (function () {
        try {
          var doc = app.activeDocument;
          var animGroup = null;

          for (var i = 0; i < doc.layers.length; i++) {
            var layer = doc.layers[i];
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

          app.echoToOE("✅ ready " + animGroup.layers.length);
        } catch (e) {
          app.echoToOE("❌ ERROR: " + e.message);
        }
      })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent init script");
  };
});
