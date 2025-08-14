function toggleOnionSkinMatchIndexMode() {
  const matchIndex = parseInt(document.getElementById("matchIndexInput").value, 10);
  const beforeSteps = parseInt(document.getElementById("beforeSteps").value, 10);
  const afterSteps = parseInt(document.getElementById("afterSteps").value, 10);

  console.log("🎯 Onion Skin (Match Index): Index =", matchIndex, "Before =", beforeSteps, "After =", afterSteps);

  const script = `
    (function () {
      var doc = app.activeDocument;
      if (!doc) {
        alert("No active document.");
        return;
      }

      function isLayerSetLocked(layerSet) {
        return layerSet.allLocked || layerSet.pixelsLocked || layerSet.positionLocked || layerSet.transparentPixelsLocked;
      }

      var matchIndex = ${matchIndex};
      var beforeSteps = ${beforeSteps};
      var afterSteps = ${afterSteps};
      var opacityMap = { 1: 50, 2: 40, 3: 30 };

      var selectedGroups = [];

      // Find selected groups (anim_* folders)
      for (var i = 0; i < doc.layers.length; i++) {
        var group = doc.layers[i];
        if (group.typename === "LayerSet" && !isLayerSetLocked(group) && group.selected) {
          selectedGroups.push(group.name);
        }
      }

      if (selectedGroups.length === 0) {
        alert("No groups selected.");
        return;
      }

      for (var g = 0; g < doc.layers.length; g++) {
        var group = doc.layers[g];
        if (group.typename !== "LayerSet" || isLayerSetLocked(group)) continue;

        var isSelectedGroup = selectedGroups.indexOf(group.name) !== -1;

        if (!isSelectedGroup) {
          // Non-selected groups hidden entirely
          group.visible = false;
          continue;
        }

        var layers = group.layers;

        for (var i = 0; i < layers.length; i++) {
          var layer = layers[i];
          if (layer.typename === "LayerSet" || layer.locked) continue;

          if (i === matchIndex) {
            layer.visible = true;
            layer.opacity = 100;
          } else {
            var distance = i - matchIndex;

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

// Bind button click after DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("matchIndexBtn").onclick = function () {
    toggleOnionSkinMatchIndexMode();
  };
});
