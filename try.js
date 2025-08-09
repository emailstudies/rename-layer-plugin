var playing = false;
var frameIndex = 0;
var timer = null;
var reverse = false;
var pingpong = false;
var direction = 1;
var fps = 12;

// Play button click
document.getElementById("playBtn").onclick = function () {
    if (playing) return;
    playing = true;

    reverse = document.getElementById("reverseChk").checked;
    pingpong = document.getElementById("pingpongChk").checked;

    var fpsInput = parseFloat(document.getElementById("fpsInput").value);
    fps = isNaN(fpsInput) ? 12 : fpsInput;

    var delay = 1000 / fps;

    // get visible top-level groups (ignore background)
    var doc = app.activeDocument;
    var topGroups = [];
    for (var i = 0; i < doc.layers.length; i++) {
        var lyr = doc.layers[i];
        if (lyr.layers && lyr.visible && lyr.name.toLowerCase() !== "background") {
            topGroups.push(lyr);
        }
    }

    // find the maximum number of frames in any group
    var maxFrames = 0;
    var groupFrames = {};
    topGroups.forEach(function (grp) {
        var count = grp.layers.length;
        groupFrames[grp.id] = count;
        if (count > maxFrames) maxFrames = count;
    });

    // start animation loop
    timer = setInterval(function () {
        // show correct frame in each group
        topGroups.forEach(function (grp) {
            var totalFrames = groupFrames[grp.id];
            for (var j = 0; j < grp.layers.length; j++) {
                grp.layers[j].visible = false;
            }
            if (frameIndex < totalFrames) {
                grp.layers[frameIndex].visible = true;
            }
        });

        // update index for next tick
        if (reverse) {
            frameIndex -= direction;
        } else {
            frameIndex += direction;
        }

        // ping-pong handling
        if (pingpong) {
            if (frameIndex >= maxFrames || frameIndex < 0) {
                direction *= -1;
                frameIndex += direction * 2; // step back into range
            }
        } else {
            // normal loop handling
            if (frameIndex >= maxFrames) frameIndex = 0;
            if (frameIndex < 0) frameIndex = maxFrames - 1;
        }
    }, delay);
};

// Stop button click
document.getElementById("stopBtn").onclick = function () {
    playing = false;
    clearInterval(timer);
    frameIndex = 0;
};
