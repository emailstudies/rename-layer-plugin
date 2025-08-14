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
      var userLayerNumber = ${userLayerNumber}; // 1-based, from bottom
      var opacityMap = { 1: 50, 2: 40, 3: 30 };

      // Gather selected root folders; also treat a folder as selected if any child layer inside it is selected
      var selectedFolderIndices = [];
      for (var i = 0; i < doc.layers.length; i++) {
        var group = doc.layers[i];
        if (group.typename !== "LayerSet" || isLayerSetLocked(group)) continue;

        var marked = !!group.selected;
        if (!marked) {
          for (var j = 0; j < group.layers.length; j++) {
            var child = group.layers[j];
            if (child.typename !== "LayerSet" && child.selected) { marked = true; break; }
          }
        }
        if (marked) selectedFolderIndices.push(i);
      }

      if (selectedFolderIndices.length === 0) {
        alert("Please select one or more folders (or a layer inside them).");
        return;
      }

      // Process root folders
      for (var g = 0; g < doc.layers.length; g++) {
        var group = doc.layers[g];
        if (group.typename !== "LayerSet" || isLayerSetLocked(group)) continue;

        var isSelectedGroup = selectedFolderIndices.indexOf(g) !== -1;

        // Non-selected folders: hide the whole folder (do not touch their child layers)
        if (!isSelectedGroup) {
          group.visible = false;
          continue;
        }

        // Selected folders: apply match-index onion skin
        group.visible = true;
        var layers = group.layers;
        if (layers.length === 0) continue;

        // Reverse index so Layer 1 = bottom
        var reverseIndex = layers.length - userLayerNumber; // 0-based top-down index
        if (reverseIndex < 0 || reverseIndex >= layers.length) {
          // Out of range for this folder; hide all its layers
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
            layer.opacity = 100; // focus layer
          } else {
            var distance = l - reverseIndex;

            if (distance > 0 && distance <= beforeSteps) {
              layer.visible = true;
              layer.opacity = opacityMap[distance] || 0;
            } else if (distance < 0 && Math.abs(distance) <= afterSteps) {
              layer.visible = true;
              layer.opacity = opacityMap[Math.abs(distance)] || 0;
            } else {
              // Outside onion range: hide, and restore opacity to 100
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
