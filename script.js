document.getElementById("renameBtn").addEventListener("click", () => {
  console.log("Rename clicked - requesting compact panel");

  // Tell Photopea host to resize the plugin panel
  parent.postMessage(
    { type: "resize", width: 300, height: 20 }, // compact height here
    "*"
  );

  console.log("Compact resize request sent to Photopea");
});
