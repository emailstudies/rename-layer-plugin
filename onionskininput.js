function toggleOnionSkinMode() {
  const beforeSteps = parseInt(document.getElementById("beforeSteps").value, 10);
  const afterSteps = parseInt(document.getElementById("afterSteps").value, 10);
  const userLayerNumber = document.getElementById("onionSkinTextInput").value.trim();

  console.log("🧅 Onion Skin: Before =", beforeSteps, "After =", afterSteps, "LayerNum =", userLayerNumber);

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
      var userLayerNumber = ${userLayerNumber ? parseInt(userLayerNumber, 10) : "null"};

      var opacityMap = { 1: 50, 2: 40, 3: 30 };
      var selectedByParent = {};

      // Current mode: collect selected layers per group
      if (userLayerNumber === null) {
        for (var i = 0; i < doc.layers.length; i++) {
          var group = doc.layers[i];
          if (group.typename === "LayerSet" && !isLayerSetLocked(group)) {
            for (var j = 0; j < group.layers.length; j++) {
              var layer = group.layers[j];
              if (layer.selected && layer.typename !== "LayerSet") {
                if (!selectedByParent[group.name]) selectedByParent[group.name] = [];
                selectedByParent[group.name].push(j);
              }
            }
          }
        }
        if (Object.keys(selectedByParent).length === 0) {
          alert("No eligible layers selected inside root folders.");
          return;
        }
      }

      // Process every root-level folder
      for (var g = 0; g < doc.layers.length; g++) {
        var group = doc.layers[g];
        if (group.typename !== "LayerSet" || isLayerSetLocked(group)) continue;

        var layers = group.layers;

        // Determine focus indexes based on mode
        var focusIndexes = [];
        if (userLayerNumber !== null) {
          var reverseIndex = layers.length - userLayerNumber; // bottom layer = Layer 1
          if (reverseIndex >= 0 && reverseIndex < layers.length) {
            focusIndexes.push(reverseIndex);
          }
        } else {
          focusIndexes = selectedByParent[group.name] || [];
        }

        var isSelectedGroup = focusIndexes.length > 0;
        if (!isSelectedGroup) {
          group.visible = false;
          continue;
        }

        for (var i = 0; i < layers.length; i++) {
          var layer = layers[i];
          if (layer.typename === "LayerSet" || layer.locked) continue;

          var set = false;

          for (var f = 0; f < focusIndexes.length; f++) {
            var focusIdx = focusIndexes[f];
            if (i === focusIdx) {
              layer.visible = true;
              layer.opacity = 100;
              set = true;
              break;
            }

            var distance = i - focusIdx;

            if (distance > 0 && distance <= beforeSteps) {
              layer.visible = true;
              layer.opacity = opacityMap[distance] || 0;
              set = true;
              break;
            } else if (distance < 0 && Math.abs(distance) <= afterSteps) {
              layer.visible = true;
              layer.opacity = opacityMap[Math.abs(distance)] || 0;
              set = true;
              break;
            }
          }

          if (!set) {
            layer.visible = false;
          }
        }
      }

      alert("✅ Onion Skin applied.");
    })();
  `;

  window.parent.postMessage(script, "*");
}
