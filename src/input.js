/** Implements event queue for inputs */


const input = {
    upBinding : "w",
    downBinding : "s",
    leftBinding : "a",
    rightBinding : "d",
    driftBinding : "Enter",
    up2Binding: "ArrowUp",
    down2Binding: "ArrowDown",
    left2Binding: "ArrowLeft",
    right2Binding: "ArrowRight",
    up : false,
    upHeld : false,
    down : false,
    downHeld : false,
    left : false,
    leftHeld : false,
    right : false,
    rightHeld : false,
    up2: false,
    up2Held: false,
    down2: false,
    down2Held: false,
    left2: false,
    left2Held: false,
    right2: false,
    right2Held: false,
    drift : false,
    driftHeld: false,
    mouseX : 0,
    mouseY : 0,
    mouseXNorm: 0,
    mouseYNorm: 0,
    mouseClicked: false,
    eventQueue: [],
    getTimeframeEvent : function(timestamp) {
        
        if(this.eventQueue.length > 0) {
            
            if(this.eventQueue[0].timeStamp < timestamp) {
                return this.eventQueue.shift();
            }
        }
        
        return null;
    },
    processTimeframeEvents : function(frameTimeStamp) {
        // Processes all events in the input event queue that occured before frameTimeStamp.
        
        for(let e = this.getTimeframeEvent(frameTimeStamp); e !== null; e = this.getTimeframeEvent(frameTimeStamp)) {
            
            if(e.type === "keydown") {
                let k = e.key;

                if(debug && debugOptions.displayKeyPresses) {
                    console.log(e.key);
                }
                
                if(k === this.upBinding) {
                    this.up = true;
                    this.upHeld = true;
                }
                if(k === this.downBinding) {
                    this.down = true;
                    this.downHeld = true;
                }
                if(k === this.leftBinding) {
                    this.left = true;
                    this.leftHeld = true;
                }
                if(k === this.rightBinding) {
                    this.right = true;
                    this.rightHeld = true;
                }
                if(k === this.driftBinding) {
                    this.drift = true;
                    this.driftHeld = true;
                }
                if(k === this.up2Binding) {
                    this.up2 = true;
                    this.up2Held = true;
                }
                if(k === this.down2Binding) {
                    this.down2 = true;
                    this.down2Held = true;
                }
                if(k === this.left2Binding) {
                    this.left2 = true;
                    this.left2Held = true;
                }
                if(k === this.right2Binding) {
                    this.right2 = true;
                    this.right2Held = true;
                }
                
            }
            
            if(e.type === "keyup") {
                let k = e.key;
                if(k === this.upBinding) {
                    this.upHeld = false;
                }
                if(k === this.downBinding) {
                    this.downHeld = false;
                }
                if(k === this.leftBinding) {
                    this.leftHeld = false;
                }
                if(k === this.rightBinding) {
                    this.rightHeld = false;
                }
                if(k === this.up2Binding) {
                    this.up2Held = false;
                }
                if(k === this.down2Binding) {
                    this.down2Held = false;
                }
                if(k === this.left2Binding) {
                    this.left2Held = false;
                }
                if(k === this.right2Binding) {
                    this.right2Held = false;
                }
                if(k === this.driftBinding) {
                    this.driftHeld = false;
                }
            }

            if(e.type === "mousemove") {
                const canvas = document.querySelector("#c");
                this.mouseX = e.pageX;
                this.mouseY = canvas.height - e.pageY; // Align y axis with opengl y axis.
                this.mouseXNorm = 2*(this.mouseX / canvas.width)-1;
                this.mouseYNorm = 2*(this.mouseY / canvas.height)-1;
            }

            if(e.type === "click") {
                this.mouseClicked = true;
            }
        }
    },
    reset : function() {
        //reset states. e.g. if keys not held then reset key state so it is ready for the next update.
        if(!this.upHeld) {
            this.up = false;
        }
        if(!this.downHeld) {
            this.down = false;
        }
        if(!this.rightHeld) {
            this.right = false;
        }
        if(!this.leftHeld) {
            this.left = false;
        }
        if(!this.driftHeld) {
            this.drift = false;
        }
        if(!this.up2Held) {
            this.up2 = false;
        }
        if(!this.down2Held) {
            this.down2 = false;
        }
        if(!this.right2Held) {
            this.right2 = false;
        }
        if(!this.left2Held) {
            this.left2 = false;
        }
        this.mouseClicked = false;
    }
};

/*All events get redirected
to the input event queue so the game can
 process them according to what frame they should be on*/
document.addEventListener("keydown", (event) => {
    input.eventQueue.push(event);
});

document.addEventListener("keyup", (event) => {
    input.eventQueue.push(event);
});

const c = document.querySelector("#c");
c.addEventListener("mousemove", (event) => {
    input.eventQueue.push(event);
});

c.addEventListener("click", (event) => {
    input.eventQueue.push(event);
});


