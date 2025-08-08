
// ✅ app.js (updated)
function getSelectedFPS() {
  const fpsSelect = document.getElementById("fpsSelect");
  return fpsSelect ? parseInt(fpsSelect.value, 10) : 12;
}

function fpsToDelay(fps) {
  return Math.round(1000 / fps);
}

function getSelectedDelay() {
  const manualInput = document.getElementById("manualDelay").value.trim();
  if (manualInput) {
    const delayInSec = parseFloat(manualInput);
    if (!isNaN(delayInSec) && delayInSec > 0) {
      return Math.round(delayInSec * 1000); // seconds to milliseconds
    }
  }

  const fps = getSelectedFPS();
  return fpsToDelay(fps);
}

// Optional: Disable fps select if manual delay exists
function updateDelayInputState() {
  const fpsSelect = document.getElementById("fpsSelect");
  const manualDelay = document.getElementById("manualDelay").value.trim();
  fpsSelect.disabled = manualDelay !== "";
}
