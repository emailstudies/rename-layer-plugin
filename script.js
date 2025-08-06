document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  const collectedFrames = [];
  let imageDataURLs = [];
  let previewWindow = null;
  let awaitingFrame = false;

  btn.onclick = () => {
    const script = `(function () {
      try {
        var doc = app.activeDocument;
        if (!doc || doc.layers.length === 0) {
          app.echoToOE("❌ No valid layers found.");
          return;
        }

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

        for (var i = 0; i < doc.layers.length; i++) {
          doc.layers[i].visible = (doc.layers[i] === animGroup);
        }

        for (var i = 0; i < animGroup.layers.length; i++) {
          animGroup.layers[i].visible = false;
        }

        app.echoToOE("[flipbook] ▶️ Starting controlled export");
        app.echoToOE("[flipbook] total:" + animGroup.layers.length);

        window._animPreview = animGroup;
        window._frameIndex = animGroup.layers.length - 1; // reverse order
        window._continueFlipbook = function () {
          var i = window._frameIndex;
          if (i < 0) {
            app.echoToOE("✅ done");
            delete window._animPreview;
            delete window._frameIndex;
            delete window._continueFlipbook;
            return;
          }

          var frame = window._animPreview.layers[i];
          frame.visible = true;
          app.refresh();
          app.echoToOE("[flipbook] ready:" + (window._animPreview.layers.length - i));
        };

        window._continueFlipbook();
      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent controlled export script to Photopea");
  };

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      awaitingFrame = false;

      // Request next frame
      const nextScript = `(function () {
        if (typeof window._continueFlipbook === "function") {
          window._frameIndex--;
          window._continueFlipbook();
        }
      })();`;
      parent.postMessage(nextScript, "*");

    } else if (typeof event.data === "string") {
      const msg = event.data;
      console.log("[flipbook] 📩 Message from Photopea:", msg);

      if (msg.startsWith("[flipbook] ready:")) {
        if (awaitingFrame) return;
        awaitingFrame = true;
        console.log("[flipbook] 🟢 Frame visible, saving PNG...");
        parent.postMessage(`app.saveToOE("png");`, "*");

      } else if (msg.startsWith("[flipbook] total:")) {
        const total = msg.split(":")[1];
        console.log("[flipbook] 🧮 Total frames:", total);

      } else if (msg === "✅ done") {
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
        console.log("[flipbook] ✅ All frames exported and sent to preview");
      } else if (msg.startsWith("❌")) {
        console.error("[flipbook] ⚠️ Error from Photopea:", msg);
      } else {
        console.log("[flipbook] ℹ️", msg);
      }
    }
  });
});
