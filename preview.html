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
    canvas { image-rendering: pixelated; }
  </style>
</head>
<body>
  <canvas id="previewCanvas"></canvas>
  <script>
    const canvas = document.getElementById("previewCanvas");
    const ctx = canvas.getContext("2d");
    let frames = [], index = 0;
    const fps = 12;

    window.addEventListener("message", async (event) => {
      if (!Array.isArray(event.data)) {
        console.warn("⚠️ Received non-array:", event.data);
        return;
      }

      console.log("📨 Received", event.data.length, "frames");

      const loadImage = (ab) => {
        return new Promise((resolve) => {
          const blob = new Blob([ab], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
          };
          img.src = url;
        });
      };

      frames = await Promise.all(event.data.map(loadImage));

      canvas.width = frames[0].width;
      canvas.height = frames[0].height;

      setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frames[index], 0, 0);
        index = (index + 1) % frames.length;
      }, 1000 / fps);
    });

    console.log("⏳ Waiting for frames in preview tab...");
  </script>
</body>
</html>
