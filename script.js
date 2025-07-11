document.getElementById("renameBtn").addEventListener("click", () => {
  const newName = document.getElementById("newName").value.trim();

  if (!newName) {
    alert("Please enter a valid name.");
    return;
  }

  const script = `
    if (app && app.activeDocument && app.activeDocument.activeLayer) {
      app.activeDocument.activeLayer.name = ${JSON.stringify(newName)};
    }
  `;

  // 👇 This line prints the script you're about to send to Photopea
  console.log("Sending rename script to Photopea:", script);

  window.parent.postMessage({ type: "ppScript", script: script }, "*");
});
