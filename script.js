window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  btn.addEventListener("click", () => {
    const newName = document.getElementById("newName").value.trim();

    if (!newName) {
      alert("Please enter a valid name.");
      return;
    }

    const script = `app.activeDocument.activeLayer.name = ${JSON.stringify(newName)};`;

    console.log("Sending script to Photopea:", script);

    window.parent.postMessage({
      type: "ppScript",
      script: script
    }, "*");
  });
});
