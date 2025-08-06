document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  btn.onclick = () => {
    const script = `(function () {
      try {
        var doc = app.activeDocument;
        if (!doc || doc.layers.length === 0) {
          app.echoToOE("❌ No valid layers found.");
          return;
        }

        app.echoToOE("[flipbook] 📄 Active document: " + doc.name);

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

        app.echoToOE("[flipbook] ✅ Found 'anim_preview' with " + animGroup.layers.length + " frame(s)");

        // Hide all root layers except anim_preview
        for (var i = 0; i < doc.layers.length; i++) {
          var rootLayer = doc.layers[i];
          rootLayer.visible = (rootLayer === animGroup);
        }

        app.echoToOE("[flipbook] 👁️ Hid all layers except 'anim_preview'");

        // Hide all anim_preview sublayers
        for (var i = 0; i < animGroup.layers.length; i++) {
          animGroup.layers[i].visible = false;
        }

        // Export each frame
        for (var i = animGroup.layers.length - 1; i >= 0; i--) {
          var frame = animGroup.layers[i];
          frame.visible = true;
          app.refresh();

          app.echoToOE("[flipbook] 📸 Exporting frame " + (animGroup.layers.length - i) + ": " + frame.name);
          app.saveToOE("png");

          frame.visible = false;
        }

        app.echoToOE("✅ done");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent visibility-based export script to Photopea");
  };

  const collectedFrames = [];
  let imageDataURLs = [];
  let previewWindow = null;

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      console.log("[flipbook] 📩 Message from Photopea:", event.data);

      if (event.data === "✅ done") {
        if (collectedFrames.length === 0) {
          alert("❌ No frames received.");
          return;
        }

        imageDataURLs = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return "data:image/png;base64," + btoa(binary);
        });

        previewWindow = window.open("preview.html");

        previewWindow.onload = () => {
          previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
        };

        collectedFrames.length = 0;
      } else if (event.data.startsWith("❌")) {
        console.error("[flipbook] ⚠️ Error from Photopea:", event.data);
      } else {
        console.log("[flipbook] ℹ️", event.data);
      }
    }
  });
});
