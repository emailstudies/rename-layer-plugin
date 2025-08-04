document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  btn.onclick = () => {
    const photopeaScript = `
      (function () {
        try {
          var original = app.activeDocument;
          if (!original || original.layers.length === 0) {
            app.echoToOE("[flipbook] ❌ No valid layers");
            return;
          }

          // Find "demo" folder
          var demoFolder = null;
          for (var i = 0; i < original.layers.length; i++) {
            var layer = original.layers[i];
            if (layer.typename === "LayerSet" && layer.name === "demo") {
              demoFolder = layer;
              break;
            }
          }

          if (!demoFolder || demoFolder.layers.length === 0) {
            app.echoToOE("[flipbook] ❌ demo folder not found or empty.");
            return;
          }

          // Create temporary export doc
          var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);

          var demoLayers = demoFolder.layers;

          for (var i = 0; i < demoLayers.length; i++) {
            var layer = demoLayers[i];

            // Clear temp doc
            app.activeDocument = tempDoc;
            while (tempDoc.layers.length > 0) {
              tempDoc.layers[0].remove();
            }

            // Duplicate current frame layer
            app.activeDocument = original;
            original.activeLayer = layer;
            layer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

            // Export PNG
            app.activeDocument = tempDoc;
            tempDoc.saveToOE("png");
          }

          // Cleanup
          app.activeDocument = tempDoc;
          tempDoc.close(SaveOptions.DONOTSAVECHANGES);
          app.echoToOE("[flipbook] done");
        } catch (e) {
          app.echoToOE("[flipbook] ❌ ERROR: " + e.message);
        }
      })();
    `;

    parent.postMessage(photopeaScript, "*");
    console.log("📤 Sent script to Photopea");
  };

  const collectedFrames = [];

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      console.log("🖼️ Frame", collectedFrames.length, "received (", event.data.byteLength, "bytes)");
    } else if (typeof event.data === "string") {
      console.log("📩 Message from Photopea:", event.data);

      if (event.data.trim() === "[flipbook] done") {
        if (collectedFrames.length === 0) {
          console.warn("❌ No frames received.");
          return;
        }

        // Build flipbook viewer
        const flipbookHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Flipbook Preview</title>
  <style>
    html, body { margin: 0; background: #111; overflow: hidden; height: 100%; display: flex; justify-content: center; align-items: center; }
    canvas { image-rendering: pixelated; }
  </style>
</head>
<body>
  <canvas id="previewCanvas"></canvas>
  <script>
    const frames = [];
    ${collectedFrames.map((ab, i) => {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
      return \`frames[\${i}] = "data:image/png;base64,\${base64}";\`;
    }).join("\\n")}

    const images = frames.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });

    const canvas = document.getElementById("previewCanvas");
    const ctx = canvas.getContext("2d");
    const fps = 12;
    let index = 0;

    const preload = () => {
      let loaded = 0;
      images.forEach(img => {
        img.onload = () => {
          loaded++;
          if (loaded === images.length) startLoop();
        };
      });
    };

    const startLoop = () => {
      canvas.width = images[0].width;
      canvas.height = images[0].height;
      setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(images[index], 0, 0);
        index = (index + 1) % images.length;
      }, 1000 / fps);
    };

    preload();
  </script>
</body>
</html>`;

        const blob = new Blob([flipbookHTML], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");

        collectedFrames.length = 0;
      } else if (event.data.startsWith("[flipbook] ❌")) {
        console.error(event.data);
      }
    }
  });
});
