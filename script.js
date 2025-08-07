<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flipbook Preview</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #1e1e1e;
      font-family: sans-serif;
    }

    #canvas-wrapper {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      padding: 16px;
      box-sizing: border-box;
    }

    canvas {
      image-rendering: pixelated;
      max-width: 100%;
      max-height: 100%;
    }

    #controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background-color: #2e2e2e;
      color: white;
      font-size: 14px;
    }

    #timeline {
      display: flex;
      gap: 4px;
      padding: 8px 16px;
      overflow-x: auto;
      background-color: #1e1e1e;
      border-top: 1px solid #444;
    }

    .thumb {
      width: 48px;
      height: 48px;
      object-fit: contain;
      border: 2px solid transparent;
      cursor: pointer;
    }

    .thumb.active {
      border-color: yellow;
    }
  </style>
</head>
<body>
  <div id="canvas-wrapper">
    <canvas id="canvas"></canvas>
  </div>
  <div id="timeline"></div>
  <div id="controls">
    <div>Frame: <span id="frameCounter">0</span></div>
    <div>
      <button onclick="prevFrame()">⏮ Prev</button>
      <button onclick="nextFrame()">Next ⏭</button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const timeline = document.getElementById("timeline");
    const frameCounter = document.getElementById("frameCounter");

    let images = [];
    let current = 0;

    function drawImage(index) {
      if (!images[index]) return;
      const img = images[index];
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      frameCounter.textContent = index + 1;

      document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
      const thumb = document.getElementById("thumb-" + index);
      if (thumb) thumb.classList.add("active");
    }

    function prevFrame() {
      current = (current - 1 + images.length) % images.length;
      drawImage(current);
    }

    function nextFrame() {
      current = (current + 1) % images.length;
      drawImage(current);
    }

    function loadImages(data) {
      images = data.images.map((src, i) => {
        const img = new Image();
        img.src = src;

        const thumb = new Image();
        thumb.src = src;
        thumb.className = "thumb";
        thumb.id = "thumb-" + i;
        thumb.onclick = () => {
          current = i;
          drawImage(i);
        };
        timeline.appendChild(thumb);

        return img;
      });

      images[0].onload = () => drawImage(0);
    }

    window.addEventListener("message", (e) => {
      if (e.data && e.data.type === "images") {
        loadImages(e.data);
      }
    });
  </script>
</body>
</html>
