document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return;

  let previewWindow = null;
  const collectedFrames = [];

  btn.onclick = () => {
    // ✅ Open new tab IMMEDIATELY
    previewWindow = window.open("", "_blank");

    collectedFrames.length = 0;

    const script = `
      (function () {
        try {
          var original = app.activeDocument;
          if (!original || original.layers.length === 0) {
            app.echoToOE("❌ No valid layers.");
            return;
          }

          var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);

          for (var i = original.layers.length - 1; i >= 0; i--) {
            var layer = original.layers[i];
            if (layer.kind !== undefined && !layer.locked && layer.visible) {
              app.activeDocument = original;
              original.activeLayer = layer;
              layer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);

              app.activeDocument = tempDoc;
              tempDoc.flatten();
              tempDoc.saveToOE("png");
              tempDoc.undo();
            }
          }

          app.activeDocument = tempDoc;
          tempDoc.close(SaveOptions.DONOTSAVECHANGES);
          app.echoToOE("done");
        } catch (e) {
          app.echoToOE("❌ " + e.message);
        }
      })();
    `;

    parent.postMessage(script, "*");
    console.log("📤 Sent export script to Photopea");
  };

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      if (event.data === "done") {
        if (!previewWindow || collectedFrames.length === 0) return;

        const frameJS = collectedFrames
          .map((buf, i) => {
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            return `frames[${i}] = "data:image/png;base64,${base64}";`;
          })
          .join("\n");

        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Flipbook</title>
  <style>
    html, body { margin: 0; background: #111; height: 100%;
      display: flex; justify-content: center; align-items: center; }
    canvas { background: white; image-rendering: pixelated; }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    const frames = [];
    ${frameJS}

    const images = frames.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });

    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d");
    let index = 0;
    const fps = 12;

    let loaded = 0;
    images.forEach(img => {
      img.onload = () => {
        loaded++;
        if (loaded === images.length) start();
      };
    });

    function start() {
      canvas.width = images[0].width;
      canvas.height = images[0].height;
      setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(images[index], 0, 0);
        index = (index + 1) % images.length;
      }, 1000 / fps);
    }
  </script>
</body>
</html>`;

        previewWindow.document.open();
        previewWindow.document.write(html);
        previewWindow.document.close();
        collectedFrames.length = 0;
      } else if (event.data.startsWith("❌")) {
        previewWindow?.document.write(`<h2 style="color:red;">${event.data}</h2>`);
        previewWindow?.document.close();
      }
    }
  });
});
