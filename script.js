document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ renameBtn not found");
    return;
  }

  btn.onclick = () => {
    const script = `
      (function () {
        try {
          var original = app.activeDocument;
          if (!original || original.layers.length === 0) {
            app.echoToOE("❌ No valid layers found.");
            return;
          }

          // 🔍 Find the 'demo' group
          var demoGroup = null;
          for (var i = 0; i < original.layers.length; i++) {
            var layer = original.layers[i];
            if (layer.typename === "LayerSet" && layer.name === "demo") {
              demoGroup = layer;
              break;
            }
          }

          if (!demoGroup || demoGroup.layers.length === 0) {
            app.echoToOE("❌ 'demo' folder not found or empty.");
            return;
          }

          // 📝 Create new temp doc
          var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);

          // 📤 Copy only layers from demoGroup to root of tempDoc
          app.activeDocument = original;
          for (var i = demoGroup.layers.length - 1; i >= 0; i--) {
            var frame = demoGroup.layers[i];
            original.activeLayer = frame;
            frame.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);
          }

          // 🔄 Switch to temp and delete any 'demo' folder if it came along
          app.activeDocument = tempDoc;
          for (var i = tempDoc.layers.length - 1; i >= 0; i--) {
            var lyr = tempDoc.layers[i];
            if (lyr.typename === "LayerSet" && lyr.name === "demo") {
              lyr.remove();
            }
          }

          // 🎞 Loop through frame layers in root, one-by-one
          for (var i = tempDoc.layers.length - 1; i >= 0; i--) {
            // Clear all layers first
            for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
              if (j !== i) tempDoc.layers[j].visible = false;
              else tempDoc.layers[j].visible = true;
            }

            tempDoc.flatten();
            tempDoc.saveToOE("png");
            tempDoc.undo();
          }

          // ✅ Done
          tempDoc.close(SaveOptions.DONOTSAVECHANGES);
          app.echoToOE("done");
        } catch (e) {
          app.echoToOE("❌ ERROR: " + e.message);
        }
      })();
    `;

    parent.postMessage(script, "*");
    console.log("📤 Sent script to Photopea");
  };

  const collectedFrames = [];

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      console.log("🖼️ Frame", collectedFrames.length, "received (", event.data.byteLength, "bytes)");
    } else if (typeof event.data === "string") {
      console.log("📩 Message from Photopea:", event.data);

      if (event.data === "done") {
        if (collectedFrames.length === 0) {
          alert("❌ No frames received.");
          return;
        }

        const flipbookHTML = \`
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
      ${collectedFrames
        .map((ab, i) => {
          const base64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
          return \`frames[\${i}] = "data:image/png;base64,\${base64}";\`;
        })
        .join("\\n")}

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
</html>\`;

        const blob = new Blob([flipbookHTML], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const win = window.open();
        win.document.open();
        win.document.write(flipbookHTML);
        win.document.close();

        collectedFrames.length = 0;
      } else if (event.data.startsWith("❌")) {
        alert(event.data);
      }
    }
  });
});
