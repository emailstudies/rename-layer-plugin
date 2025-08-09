function cycleFrames(total, delay, reverse, pingpong) {
  console.log(`▶️ cycleFrames total=${total}, delay=${delay}ms`);

  // Always start at Layer 1 (index n-1) unless explicitly reversed
  let i = reverse ? 0 : total - 1;
  let direction = reverse ? 1 : -1;
  let goingForward = true;

  clearTimer();
  shouldStop = false;

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation stopped.");
      clearTimer();
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ Showing frame index: ${i}`);

    if (pingpong) {
      if (goingForward) {
        i += direction;
        if ((direction === 1 && i >= total) || (direction === -1 && i < 0)) {
          goingForward = false;
          i -= 2 * direction;
        }
      } else {
        i -= direction;
        if ((direction === 1 && i < 0) || (direction === -1 && i >= total)) {
          goingForward = true;
          i += 2 * direction;
        }
      }
    } else {
      i += direction;
      if (i < 0) i = total - 1; // Reset to Layer 1 after last frame
      if (i >= total) i = 0;
    }

    currentTimerId = setTimeout(next, delay);
  }

  next();
}

function cycleFramesRange(start, stop, delay, reverse, pingpong, frameCount) {
  console.log(`▶️ cycleFramesRange from ${start} to ${stop}`);

  // Convert 1-based UI input to 0-based indexes
  let startIndex = frameCount - start;
  let stopIndex = frameCount - stop;

  if (startIndex < stopIndex) [startIndex, stopIndex] = [stopIndex, startIndex];

  // Always start at startIndex unless reversed
  let i = reverse ? stopIndex : startIndex;
  let direction = reverse ? 1 : -1;
  let goingForward = true;

  clearTimer();
  shouldStop = false;

  function next() {
    if (shouldStop) {
      console.log("🛑 Animation stopped.");
      clearTimer();
      return;
    }

    showOnlyFrame(i);
    console.log(`▶️ Showing frame index: ${i}`);

    if (pingpong) {
      if (goingForward) {
        i += direction;
        if ((direction === 1 && i > startIndex) || (direction === -1 && i < stopIndex)) {
          goingForward = false;
          i -= 2 * direction;
        }
      } else {
        i -= direction;
        if ((direction === 1 && i < stopIndex) || (direction === -1 && i > startIndex)) {
          goingForward = true;
          i += 2 * direction;
        }
      }
    } else {
      i += direction;
      if (direction === -1 && i < stopIndex) i = startIndex; // Reset to startIndex
      if (direction === 1 && i > startIndex) i = stopIndex;
    }

    currentTimerId = setTimeout(next, delay);
  }

  next();
}
