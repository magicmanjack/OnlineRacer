/* The general way to use this object is:
    const audioObject = audio.loadAudio("filename.mp3");
    audioObject.play() or audioObject.play(true) for looping
    audioObject.stop() to stop the audio. (Deletes it as well)

    Note: play() will always create a new instance of the audio. This allows you to play the
    the same sound multiple times simultaneously. 
    Also note, stop() only stops and destroys the most recent instance of this sound.
    Also note, it is a good idea to call audio.loadAudio() a while before it is used since the audio
    might not be loaded into memory yet.

    Sounds will automatically be destroyed when they have finished playing.

    You can modify the playback rate of the latest instance of a sound with
    audioObject.setPlaybackRate(rate)

    You can modify the volume of a latest instance of a sound with
    audioObject.setVolume(volume)
*/

var audioContext = new AudioContext();

const audio = {
    init:function() {
        this.masterGainNode.connect(this.audioContext.destination);
        const volumeControl = document.querySelector("#volume");
        volumeControl.addEventListener("input", () => {
            this.masterGainNode.gain.value = volumeControl.value;
        });

    },
    masterGainNode:audioContext.createGain(),
    audioContext: audioContext,
    audioNodes: [],
    loadAudio : function(fileName) {
        
        const audioObject = {
            playQueued:false,
            play: function(loop=false) {
                //The current implementation creates a new instance and starts it from the beginning
                this.loop = loop;
                if(this.ready) {
                    this.currentAudioSrc = audio.audioContext.createBufferSource();
                    this.currentAudioSrc.buffer = this.audioBuffer;
                    
                    //Create unique gain node for this
                    const gainNode = audio.audioContext.createGain();
                    this.currentAudioSrc.connect(gainNode);
                    gainNode.connect(audio.masterGainNode);

                    this.currentGainNode = gainNode;

                    //Set playback properties
                    this.currentAudioSrc.loop = loop;
                    this.currentAudioSrc.playbackRate.value = this.playbackRate;
                    this.currentGainNode.gain.value = this.volume;

                    
                    //What to do when the audio has finished playing
                    const toDestroy = this.currentAudioSrc; // The reason for this is that this.currentAudioSource can change
                    this.currentAudioSrc.addEventListener("ended", () => {
                        //disconnect from active audio context
                        
                        audio.destroy(toDestroy);

                        if(toDestroy == audioObject.currentAudioSrc) {
                            audioObject.currentAudioSrc = null; //If referenced by this audioObject
                        }

                    })

                    this.currentAudioSrc.start();  
                    audio.audioNodes.push({
                        audioSrc: audioObject.currentAudioSrc,
                        gainNode: gainNode
                    });
                } else {
                    this.playQueued = true; // This is used to signal playing the audio when it is loaded
                }
            },
            stop: function() {
                /*Stop will only stop the most recent instance. So if the audio is looping, 
                it is important to stop it before starting a new instance.
                */
                
                if(this.ready) {
                    this.currentAudioSrc.stop();
                    audio.destroy(this.currentAudioSrc);
                } else if(this.playQueued){
                    this.playQueued = false;
                }
            },
            setPlaybackRate: function(rate) {
                this.playbackRate = rate;
                if(this.currentAudioSrc) {
                    this.currentAudioSrc.playbackRate.value = rate;
                }
            },
            setVolume:function(volume) {
                this.volume = volume;
                if(this.currentAudioSrc) {
                    this.currentGainNode.gain.value = this.volume;
                }
            },
            volume: 1,
            playbackRate:1,
            audioBuffer:null,
            currentAudioSrc:null,
            currentGainNode:null,
            ready:false,
            loop:false
        };

        fetch(fileName).then((file) => {
            return file.arrayBuffer();
        }).then((arrayBuffer) => {
            return audio.audioContext.decodeAudioData(arrayBuffer);
        }).then((buffer) => {
            audioObject.audioBuffer = buffer;
            audioObject.ready = true;
            if(audioObject.playQueued) {
                audioObject.play(audioObject.loop);
                audioObject.playQueued = false;
            } 
        });

       return audioObject;
    },
    destroy: function(audioBufferSrc) {
            //Takes an AudioBufferSourceNode and removes both it and its gain node from the audio context
            for(let i = 0; i < audio.audioNodes.length; i++) {
                const nodes = audio.audioNodes[i]; // Nodes will be an object containing the src node and the gain node
                if(audioBufferSrc == nodes.audioSrc) {
                    //remove from list and exit
                    nodes.gainNode.disconnect(audio.masterGainNode);
                    audio.audioNodes.splice(i, 1);
                    return;
                }
            }
    },
    reset: function() {
        //Clears all audio
        this.audioNodes.forEach(nodes => {
            nodes.gainNode.disconnect(audio.masterGainNode);
        });
        this.audioNodes = [];
    }
};

audio.init();