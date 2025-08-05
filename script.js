// Flipbook Preview Script (Final: clears canvas correctly, no alert, skips Background)
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  btn.onclick = () => {
    const script = `(function () {
      try {
        var original = app.activeDocument;
        if (!original || original.layers.length === 0) {
          app.echoToOE("❌ No valid layers found.");
          return;
        }

        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);

        for (var i = original.layers.length - 1; i >= 0; i--) {
          var layer = original.layers[i];
          if (!(layer.name === "Background" && layer.locked)) {
            app.activeDocument = tempDoc;
            for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
              tempDoc.layers[j].remove();
            }

            app.activeDocument = original;
            original.activeLayer = layer;
            layer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

            app.activeDocument = tempDoc;
            tempDoc.saveToOE("png");
          }
        }

        app.activeDocument = tempDoc;
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.echoToOE("done");
      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("📤 Sent export script to Photopea");
  };

  const collectedFrames = [];

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      console.log("📩 Message from Photopea:", event.data);

      if (event.data === "done") {
        if (collectedFrames.length === 0) {
          console.log("❌ No frames received.");
          return;
        }

        const framesBase64 = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return btoa(binary);
        });

        const frameJS = framesBase64
          .map((b64, i) => `frames[${i}] = "data:image/png;base64,${b64}";`)
          .join("\n");

        const flipbookHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>Flipbook Preview</title>
    <style>
      html, body {
        margin: 0;
        background: #111;
        overflow: hidden;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      canvas {
        image-rendering: pixelated;
      }
    </style>
  </head>
  <body>
    <canvas id="previewCanvas"></canvas>
    <script>
      const frames = [];
      ${frameJS}

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
          // ✅ Clear canvas completely
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // ✅ Paint solid white background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // ✅ Draw current frame
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
        const win = window.open();
        win.document.open();
        win.document.write(flipbookHTML);
        win.document.close();

        collectedFrames.length = 0;
      } else if (event.data.startsWith("❌")) {
        console.log("⚠️ Photopea reported:", event.data);
      }
    }
  });
});
