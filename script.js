document.getElementById("renameBtn").addEventListener("click", () => {
  console.log("Rename clicked - resizing panel");
  
  if (window.frameElement) {
    window.frameElement.style.width = "200px";  // shrink width
    window.frameElement.style.height = "40px";  // shrink height
    console.log("Panel resized inside Photopea");
  } else {
    console.warn("Not inside an iframe — can't resize panel");
  }
});
