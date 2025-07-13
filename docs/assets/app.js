// Initialize core Tone.js nodes
const player = new Tone.Player();                          // Main audio player
const pitchShift = new Tone.PitchShift();                  // Pitch shift effect
const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 });    // Reverb effect (initial wet level = 0.3)
const eq = new Tone.EQ3(0, 0, 0);                          // 3-band Equalizer: low, mid, high
const gain = new Tone.Gain(1);                             // Master volume gain (1 = 100%)

// Connect nodes in order: Player → Pitch → EQ → Reverb → Gain → Output
player.chain(pitchShift, eq, reverb, gain, Tone.Destination);

// Playback state variables
let isPlaying = false;
let isLooping = false;
let playbackStartTime = 0;
let playbackOffset = 0;
let progressInterval;

// DOM references for control elements
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");
const muteBtn = document.getElementById("muteBtn");
const progressBar = document.getElementById("progressBar");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const songTitle = document.getElementById("songTitle");

// Helper to format seconds into mm:ss
const formatTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Periodically update playback progress bar and time label
const updateProgress = () => {
    if (isPlaying && player.buffer && player.buffer.loaded) {
        const elapsed = (Tone.now() - playbackStartTime) * player.playbackRate + playbackOffset;
        currentTime.innerText = formatTime(elapsed);
        progressBar.value = elapsed;
    }
};

// Load and start playing the selected song
async function loadAndPlay(url, title) {
    // Highlight active song
    document.querySelectorAll(".song-item").forEach(i => i.classList.remove("active"));
    const selected = [...document.querySelectorAll(".song-item")].find(i => i.dataset.src === url);
    if (selected) selected.classList.add("active");

    // Load new track and reset state
    player.stop();
    await player.load(url);
    songTitle.innerText = title;
    progressBar.max = player.buffer.duration;
    totalTime.innerText = formatTime(player.buffer.duration);
    playbackOffset = 0;
    isPlaying = false;

    // Trigger play
    document.getElementById("playBtn").click();
}

// Register click handler for each song in the list
document.querySelectorAll('.song-item').forEach(item => {
    item.onclick = () => loadAndPlay(item.dataset.src, item.dataset.title);
});

// Toggle Play/Pause logic
document.getElementById("playBtn").onclick = async () => {
    await Tone.start(); // Required to resume AudioContext (Chrome autoplay policy)

    if (!isPlaying) {
        // Start playback
        playbackStartTime = Tone.now();
        player.loop = isLooping;
        player.start(undefined, playbackOffset);
        isPlaying = true;
        document.getElementById("playBtn").innerHTML = '<i class="fas fa-pause text-dark"></i>';
        progressInterval = setInterval(updateProgress, 200);
    } else {
        // Pause playback
        player.stop();
        playbackOffset += (Tone.now() - playbackStartTime) * player.playbackRate;
        isPlaying = false;
        document.getElementById("playBtn").innerHTML = '<i class="fas fa-play text-dark"></i>';
        clearInterval(progressInterval);
    }
};

// Handle seeking using progress bar
progressBar.oninput = () => {
    const value = parseFloat(progressBar.value);
    playbackOffset = value;

    if (isPlaying) {
        player.stop();
        playbackStartTime = Tone.now();
        player.start(undefined, value);
    }
};

// Volume slider change handler
volumeSlider.oninput = e => {
    const val = parseFloat(e.target.value);
    gain.gain.rampTo(val, 0.1); // Smooth volume change
    volumeValue.innerText = Math.round(val * 100) + "%";
    muteBtn.innerHTML = `<i class="fas fa-volume-${val === 0 ? "mute" : "up"}"></i>`;
};

// Toggle mute/unmute
muteBtn.onclick = () => {
    const isMuted = gain.gain.value === 0;
    const currentVolume = parseFloat(volumeSlider.value) || 1;
    gain.gain.rampTo(isMuted ? currentVolume : 0, 0.1);
    muteBtn.innerHTML = `<i class="fas fa-volume-${isMuted ? "up" : "mute"}"></i>`;
};

// Loop button toggle handler
document.getElementById("loopBtn").onclick = () => {
    isLooping = !isLooping;
    player.loop = isLooping;
    loopBtn.innerText = isLooping ? "Loop On" : "Loop Off";
};

// Tuning: playback speed
document.getElementById("speedControl").oninput = e => {
    player.playbackRate = parseFloat(e.target.value);
    document.getElementById("speedValue").innerText = e.target.value + "x";
};

// Tuning: pitch shifting
document.getElementById("pitchControl").oninput = e => {
    pitchShift.pitch = parseFloat(e.target.value);
    document.getElementById("pitchValue").innerText = e.target.value;
};

// Tuning: reverb wetness
document.getElementById("reverbControl").oninput = e => {
    reverb.wet.value = parseFloat(e.target.value);
    document.getElementById("reverbValue").innerText = e.target.value;
};

// Equalizer: low, mid, high
["low", "mid", "high"].forEach(band => {
    document.getElementById(band + "EQ").oninput = e => {
        eq[band].value = parseFloat(e.target.value);
        document.getElementById(`${band}EQValue`).innerText = e.target.value;
    };
});

// Reset tuning (speed, pitch, reverb) to default values
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

// Reset EQ bands (low/mid/high) to neutral
document.getElementById("eqResetBtn").onclick = () => {
    ["low", "mid", "high"].forEach(b => {
        eq[b].value = 0;
        document.getElementById(`${b}EQ`).value = 0;
        document.getElementById(`${b}EQValue`).innerText = "0";
    });
};

// Reset settings (volume, loop)
document.getElementById("volResetBtn").onclick = () => {
    volumeSlider.value = 1;
    gain.gain.rampTo(1, 0.1);
    volumeValue.innerText = "100%";
    muteBtn.innerHTML = `<i class="fas fa-volume-up"></i>`;
    isLooping = false;
    loopBtn.innerText = "Loop Off";
};
