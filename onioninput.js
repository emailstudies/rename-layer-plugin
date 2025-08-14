function toggleOnionSkinMatchIndexMode() {
  var beforeSteps = parseInt(document.getElementById("beforeSteps").value, 10);
  var afterSteps = parseInt(document.getElementById("afterSteps").value, 10);
  var matchIndex = parseInt(document.getElementById("matchIndex").value, 10);

  var opacityMap = {
    1: 50,
    2: 25,
    3: 10
  };

  var doc = app.activeDocument;
  if (!doc) {
    alert("No active document open.");
    return;
  }

  // Collect only selected top-level folders
  var selectedFolders = [];
  for (var i = 0; i < doc.layers.length; i++) {
    var lyr = doc.layers[i];
    if (lyr.typename === "LayerSet" && lyr.selected) {
      selectedFolders.push(lyr);
    }
  }

  if (selectedFolders.length === 0) {
    alert("Please select at least one folder.");
    return;
  }

  // Hide all non-selected folders (set visible = false for the whole folder)
  for (var i = 0; i < doc.layers.length; i++) {
    var lyr = doc.layers[i];
    if (lyr.typename === "LayerSet" && !lyr.selected) {
      lyr.visible = false;
    }
  }

  // Apply onion skin logic for each selected folder
  for (var f = 0; f < selectedFolders.length; f++) {
    var folder = selectedFolders[f];
    var layers = folder.layers;

    // First hide all layers in this folder
    for (var i = 0; i < layers.length; i++) {
      layers[i].visible = false;
      layers[i].opacity = 100;
    }

    if (matchIndex < 0 || matchIndex >= layers.length) {
      alert("Match index out of range in folder: " + folder.name);
      continue;
    }

    // Set the exact match layer
    layers[matchIndex].visible = true;
    layers[matchIndex].opacity = 100;

    // Before steps
    for (var step = 1; step <= beforeSteps; step++) {
      var idx = matchIndex - step;
      if (idx >= 0) {
        layers[idx].visible = true;
        layers[idx].opacity = opacityMap[step] || 100;
      }
    }

    // After steps
    for (var step = 1; step <= afterSteps; step++) {
      var idx = matchIndex + step;
      if (idx < layers.length) {
        layers[idx].visible = true;
        layers[idx].opacity = opacityMap[step] || 100;
      }
    }
  }
}
