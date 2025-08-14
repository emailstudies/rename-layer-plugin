function toggleOnionSkinMatchIndexMode() {
  const beforeSteps = parseInt(document.getElementById("beforeSteps").value, 10);
  const afterSteps = parseInt(document.getElementById("afterSteps").value, 10);
  const userLayerNumber = parseInt(document.getElementById("onionSkinTextInput").value.trim(), 10);

  if (isNaN(userLayerNumber)) {
    alert("Please enter a valid layer index.");
    return; 
  }

  console.log("🎯 Onion Skin Match Index:", userLayerNumber, "Before =", beforeSteps, "After =", afterSteps);

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

      var beforeSteps = ${beforeSteps};
      var afterSteps = ${afterSteps};
      var targetIndex = ${userLayerNumber};
      var opacityMap = { 1: 50, 2: 40, 3: 30 };

      // Get selected folders only
      var selectedFolders = [];
      for (var i = 0; i < doc.layers.length; i++) {
        var group = doc.layers[i];
        if (group.typename === "LayerSet" && group.selected && !isLayerSetLocked(group)) {
          selectedFolders.push(group);
        }
      }

      if (selectedFolders.length === 0) {
        alert("No folders selected.");
        return;
      }

      for (var f = 0; f < selectedFolders.length; f++) {
        var folder = selectedFolders[f];
        folder.visible = true;

        var layers = folder.layers;
        var reverseIndex = layers.length - targetIndex; // match index from bottom if needed
        if (reverseIndex < 0 || reverseIndex >= layers.length) continue;

        for (var l = 0; l < layers.length; l++) {
          var layer = layers[l];
          if (layer.typename === "LayerSet" || layer.locked) continue;

          var distance = l - reverseIndex;

          if (l === reverseIndex) {
            layer.visible = true;
            layer.opacity = 100;
          } else if (distance > 0 && distance <= beforeSteps) {
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

      alert("✅ Match Index Onion Skin applied.");
    })();
  `;

  window.parent.postMessage(script, "*");
}

// ====== Click Binding ======
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("matchIndexBtn").onclick = function () {
    toggleOnionSkinMatchIndexMode();
  };
});
