var musicBuffer = null;
var soundBuffer = null;
var audioContext = new AudioContext();

function loadAudio(elementId, volume = 0.15) {
    // Load file from audio element
    const audioElement = document.getElementById(elementId);
    const track = audioContext.createMediaElementSource(audioElement);

    // Set default volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    // Add modifier based on volume slider (0% to 200% of default volume value)
    const volumeControlGainNode = audioContext.createGain();
    volumeControlGainNode.gain.value = volume;
    const volumeControl = document.querySelector("#volume");
    volumeControl.addEventListener("input", () => {
        volumeControlGainNode.gain.value = volumeControl.value;
    });

    track.connect(gainNode).connect(volumeControlGainNode).connect(audioContext.destination);

    return audioElement;
}