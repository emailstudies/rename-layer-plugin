window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("Rename button not found");
    return;
  }

  btn.addEventListener("click", () => {
    const newName = document.getElementById("newName").value.trim();

    if (!newName) {
      alert("Please enter a valid name.");
      return;
    }

    // Safe and direct messaging using Photopea's API
    const jsxScript = `
      if (app && app.activeDocument && app.activeDocument.activeLayer) {
        app.activeDocument.activeLayer.name = ${JSON.stringify(newName)};
      } else {
        alert("No layer selected.");
      }
    `;

    console.log("Sending script to Photopea:", jsxScript);

    window.parent.postMessage("alert(1)", "*");
  });
});
