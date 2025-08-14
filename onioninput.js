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

      function isLayerSetLocked(layerSet) {
        return layerSet.allLocked || layerSet.pixelsLocked || layerSet.positionLocked || layerSet.transparentPixelsLocked;
      }

      var beforeSteps = ${beforeSteps};
      var afterSteps  = ${afterSteps};
      var userLayerNumber = ${userLayerNumber}; // 1-based from bottom
      var opacityMap = { 1: 50, 2: 40, 3: 30 };

      // Gather selected root folders (or folders with a selected child layer)
      var selectedFolderIndices = [];
      for (var i = 0; i < doc.layers.length; i++) {
        var item = doc.layers[i];
        if (item.typename === "LayerSet" && !isLayerSetLocked(item)) {
          var marked = !!item.selected;
          if (!marked) {
            for (var j = 0; j < item.layers.length; j++) {
              var child = item.layers[j];
              if (child.typename !== "LayerSet" && child.selected) { marked = true; break; }
            }
          }
          if (marked) selectedFolderIndices.push(i);
        }
      }

      if (selectedFolderIndices.length === 0) {
        alert("Please select one or more folders (or a layer inside them).");
        return;
      }

      // Hide all non-selected folders and all non-Background root layers
      for (var i = 0; i < doc.layers.length; i++) {
        var rootLayer = doc.layers[i];
        var isSelectedGroup = selectedFolderIndices.indexOf(i) !== -1;

        if (rootLayer.typename === "LayerSet") {
          if (!isSelectedGroup) rootLayer.visible = false;
        } else if (rootLayer.typename === "ArtLayer" && rootLayer.name.toLowerCase() !== "background") {
          rootLayer.visible = false;
        }
      }

      // Apply onion skin to each selected folder
      for (var g = 0; g < doc.layers.length; g++) {
        var group = doc.layers[g];
        if (group.typename !== "LayerSet" || isLayerSetLocked(group)) continue;
        var isSelectedGroup = selectedFolderIndices.indexOf(g) !== -1;
        if (!isSelectedGroup) continue;

        group.visible = true;
        var layers = group.layers;
        if (layers.length === 0) continue;

        // Reverse index: Layer 1 = bottom
        var reverseIndex = layers.length - userLayerNumber; // 0-based top-down index
        if (reverseIndex < 0 || reverseIndex >= layers.length) {
          // Out of range: hide all
          for (var l = 0; l < layers.length; l++) {
            var lyr = layers[l];
            if (lyr.typename === "LayerSet" || lyr.locked) continue;
            lyr.visible = false;
            lyr.opacity = 100;
          }
          continue;
        }

        for (var l = 0; l < layers.length; l++) {
          var layer = layers[l];
          if (layer.typename === "LayerSet" || layer.locked) continue;

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

      alert("✅ Onion Skin (Match Index) applied to all selected folders.");
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
