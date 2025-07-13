
    const player = new Tone.Player();
    const pitchShift = new Tone.PitchShift();
    const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 });
    const eq = new Tone.EQ3(0, 0, 0);
    const gain = new Tone.Gain(1);

    player.chain(pitchShift, eq, reverb, gain, Tone.Destination);

    let isPlaying = false, isLooping = false;
    let playbackStartTime = 0, playbackOffset = 0, progressInterval;

    const volumeSlider = document.getElementById("volumeSlider");
    const volumeValue = document.getElementById("volumeValue");
    const muteBtn = document.getElementById("muteBtn");
    const progressBar = document.getElementById("progressBar");
    const currentTime = document.getElementById("currentTime");
    const totalTime = document.getElementById("totalTime");
    const songTitle = document.getElementById("songTitle");

    const formatTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    const updateProgress = () => {
    if (isPlaying && player.buffer && player.buffer.loaded) {
    const elapsed = (Tone.now() - playbackStartTime) * player.playbackRate + playbackOffset;
    currentTime.innerText = formatTime(elapsed);
    progressBar.value = elapsed;
}
};

    async function loadAndPlay(url, title) {
    document.querySelectorAll(".song-item").forEach(i => i.classList.remove("active"));
    const selected = [...document.querySelectorAll(".song-item")].find(i => i.dataset.src === url);
    if (selected) selected.classList.add("active");

    player.stop();
    await player.load(url);
    songTitle.innerText = title;
    progressBar.max = player.buffer.duration;
    totalTime.innerText = formatTime(player.buffer.duration);
    playbackOffset = 0;
    isPlaying = false;
    document.getElementById("playBtn").click();
}

    document.querySelectorAll('.song-item').forEach(item => {
    item.onclick = () => loadAndPlay(item.dataset.src, item.dataset.title);
});

    document.getElementById("playBtn").onclick = async () => {
    await Tone.start();
    if (!isPlaying) {
    playbackStartTime = Tone.now();
    player.loop = isLooping;
    player.start(undefined, playbackOffset);
    isPlaying = true;
    document.getElementById("playBtn").innerHTML = '<i class="fas fa-pause text-dark"></i>';
    progressInterval = setInterval(updateProgress, 200);
} else {
    player.stop();
    playbackOffset += (Tone.now() - playbackStartTime) * player.playbackRate;
    isPlaying = false;
    document.getElementById("playBtn").innerHTML = '<i class="fas fa-play text-dark"></i>';
    clearInterval(progressInterval);
}
};

    progressBar.oninput = () => {
    const value = parseFloat(progressBar.value);
    playbackOffset = value;
    if (isPlaying) {
    player.stop();
    playbackStartTime = Tone.now();
    player.start(undefined, value);
}
};

    volumeSlider.oninput = e => {
    const val = parseFloat(e.target.value);
    gain.gain.rampTo(val, 0.1);
    volumeValue.innerText = Math.round(val * 100) + "%";
    muteBtn.innerHTML = `<i class="fas fa-volume-${val === 0 ? "mute" : "up"}"></i>`;
};

    muteBtn.onclick = () => {
    const isMuted = gain.gain.value === 0;
    const currentVolume = parseFloat(volumeSlider.value) || 1;
    gain.gain.rampTo(isMuted ? currentVolume : 0, 0.1);
    muteBtn.innerHTML = `<i class="fas fa-volume-${isMuted ? "up" : "mute"}"></i>`;
};

    document.getElementById("loopBtn").onclick = () => {
    isLooping = !isLooping;
    player.loop = isLooping;
    loopBtn.innerText = isLooping ? "Loop On" : "Loop Off";
};

    document.getElementById("speedControl").oninput = e => {
    player.playbackRate = parseFloat(e.target.value);
    document.getElementById("speedValue").innerText = e.target.value + "x";
};

    document.getElementById("pitchControl").oninput = e => {
    pitchShift.pitch = parseFloat(e.target.value);
    document.getElementById("pitchValue").innerText = e.target.value;
};

    document.getElementById("reverbControl").oninput = e => {
    reverb.wet.value = parseFloat(e.target.value);
    document.getElementById("reverbValue").innerText = e.target.value;
};

    ["low", "mid", "high"].forEach(band => {
    document.getElementById(band + "EQ").oninput = e => {
        eq[band].value = parseFloat(e.target.value);
        document.getElementById(`${band}EQValue`).innerText = e.target.value;
    };
});

    document.getElementById("tuningResetBtn").onclick = () => {
    player.playbackRate = 1;
    pitchShift.pitch = 0;
    reverb.wet.value = 0.3;
    document.getElementById("speedControl").value = 1;
    document.getElementById("pitchControl").value = 0;
    document.getElementById("reverbControl").value = 0.3;
    document.getElementById("speedValue").innerText = "1x";
    document.getElementById("pitchValue").innerText = "0";
    document.getElementById("reverbValue").innerText = "0.3";
};

    document.getElementById("eqResetBtn").onclick = () => {
    ["low", "mid", "high"].forEach(b => {
        eq[b].value = 0;
        document.getElementById(`${b}EQ`).value = 0;
        document.getElementById(`${b}EQValue`).innerText = "0";
    });
};

    document.getElementById("globalResetBtn").onclick = () => {
    volumeSlider.value = 1;
    gain.gain.rampTo(1, 0.1);
    volumeValue.innerText = "100%";
    muteBtn.innerHTML = `<i class="fas fa-volume-up"></i>`;
    isLooping = false;
    loopBtn.innerText = "Loop Off";
};
