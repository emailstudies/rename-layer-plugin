function toggleOnionSkinMatchIndexMode() {
  const beforeSteps = parseInt(document.getElementById("beforeSteps").value, 10);
  const afterSteps  = parseInt(document.getElementById("afterSteps").value, 10);
  const inputEl = document.getElementById("matchIndexInput");

  if (!inputEl || inputEl.value.trim() === "" || isNaN(parseInt(inputEl.value, 10))) {
    alert("Please enter a valid frame number.");
    return;
  }
  const userLayerNumber = parseInt(inputEl.value, 10); // 1 = bottom layer

  console.log("🎯 Match Index:", userLayerNumber, "Before =", beforeSteps, "After =", afterSteps);

  const script = `
    (function () {
      var doc = app.activeDocument;
      if (!doc) { alert("No active document."); return; }

      function isLayerLocked(layer) {
        return layer.allLocked || layer.pixelsLocked || layer.positionLocked || layer.transparentPixelsLocked;
      }

      var beforeSteps = ${beforeSteps};
      var afterSteps  = ${afterSteps};
      var userLayerNumber = ${userLayerNumber};
      var opacityMap = { 1: 50, 2: 40, 3: 30 };

      var selectedFolderIndices = [];
      var rootLayerSelected = false;

      // Scan root layers
      for (var i = 0; i < doc.layers.length; i++) {
        var item = doc.layers[i];

        // 🚫 If a root-level normal layer is selected → stop later
        if (item.typename !== "LayerSet" && item.selected) {
          rootLayerSelected = true;
        }

        // ✅ Collect selected folders
        if (item.typename === "LayerSet" && !isLayerLocked(item)) {
          var marked = !!item.selected;
          if (!marked) {
            for (var j = 0; j < item.layers.length; j++) {
              var child = item.layers[j];
              if (child.selected) { marked = true; break; }
            }
          }
          if (marked) selectedFolderIndices.push(i);
        }
      }

      // 🚫 If only a normal root layer is selected
      if (rootLayerSelected && selectedFolderIndices.length === 0) {
        alert("Please select a folder (LayerSet), not a single root-level layer.");
        return;
      }

      if (selectedFolderIndices.length === 0) {
        alert("Please select one or more folders (or a layer inside them).");
        return;
      }

      // Hide all non-selected root folders and root layers (unless locked)
      for (var i = 0; i < doc.layers.length; i++) {
        var rootLayer = doc.layers[i];
        var isSelectedGroup = selectedFolderIndices.indexOf(i) !== -1;
        if (isLayerLocked(rootLayer)) continue;

        if (rootLayer.typename === "LayerSet") {
          if (!isSelectedGroup) rootLayer.visible = false;
        } else {
          rootLayer.visible = false;
        }
      }

      // Apply onion skin to each selected folder
      for (var g = 0; g < doc.layers.length; g++) {
        var group = doc.layers[g];
        if (group.typename !== "LayerSet" || isLayerLocked(group)) continue;
        if (selectedFolderIndices.indexOf(g) === -1) continue;

        group.visible = true;
        var layers = group.layers;
        if (layers.length === 0) continue;

        // Special case: only 1 layer inside → always visible
        if (layers.length === 1) {
          if (!isLayerLocked(layers[0])) layers[0].visible = true;
          continue;
        }

        // Reverse index: Layer 1 = bottom
        var reverseIndex = layers.length - userLayerNumber;
        if (reverseIndex < 0 || reverseIndex >= layers.length) {
          for (var l = 0; l < layers.length; l++) {
            if (!isLayerLocked(layers[l])) {
              layers[l].visible = false;
              layers[l].opacity = 100;
            }
          }
          continue;
        }

        for (var l = 0; l < layers.length; l++) {
          var layer = layers[l];
          if (isLayerLocked(layer)) continue;

          if (l === reverseIndex) {
            layer.visible = true;
            layer.opacity = 100;
          } else {
            var distance = l - reverseIndex;
            if (distance > 0 && distance <= beforeSteps) {
              layer.visible = true;
              layer.opacity = opacityMap[distance] || 0;
            } else if (distance < 0 && Math.abs(distance) <= afterSteps) {
              layer.visible = true;
              layer.opacity = opacityMap[Math.abs(distance)] || 0;
            } else {
              layer.visible = false;
              layer.opacity = 100;
            }
          }
        }
      }

      alert("✅ Onion Skin (Match Index) applied.");
    })();
  `;

  window.parent.postMessage(script, "*");
}

document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("matchIndexBtn");
  if (btn) {
    btn.onclick = toggleOnionSkinMatchIndexMode;
  }
});
