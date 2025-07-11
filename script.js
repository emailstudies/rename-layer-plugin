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

    // Avoid multiline strings and escape quotes properly
    const safeScript = `if(app&&app.activeDocument&&app.activeDocument.activeLayer){app.activeDocument.activeLayer.name=${JSON.stringify(newName)};}else{alert("No layer selected.");}`;

    console.log("Sending rename script to Photopea:", safeScript);
    window.parent.postMessage({ type: "ppScript", script: safeScript }, "*");
  });
});
