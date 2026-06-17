"use strict"
/** Implements event queue for inputs */

const input = {
    events:[], // Useful for if you want to provide custom functionality. Gets filled each update.
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
        this.events = [];
        for(let e = this.getTimeframeEvent(frameTimeStamp); e !== null; e = this.getTimeframeEvent(frameTimeStamp)) {
            this.events.push(e);
            if(e.type === "keydown") {
                let k = e.key;

                this
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

//Check if mobile device and map touchstart and touchend events to key presses
{
    const touchCurrentBinding = new Map();
    if(navigator.userAgentData?.mobile || /iPhone/i.test(navigator.userAgent)) {

        
        function mapTouchToKeys(mappings) {

            function signalKeyUp(binding) {
                        if(binding === " ") {
                            return;
                        }
                        if(Array.isArray(binding)) {
                            for(let i = 0; i < binding.length; i++) {
                                const c = new CustomEvent("keyup");
                                c.key = binding[i];
                                document.dispatchEvent(c);
                            }
                        } else {
                            const c = new CustomEvent("keyup");
                            c.key = binding;
                            document.dispatchEvent(c);
                        }
            }

            function signalKeyDown(binding) {
                        if(binding === " ") {
                            return;
                        }   
                        if(Array.isArray(binding)) {
                            for(let i = 0; i < binding.length; i++) {
                                const c = new CustomEvent("keydown");
                                c.key = binding[i];
                                document.dispatchEvent(c);
                            }
                        } else {
                            const c = new CustomEvent("keydown");
                            c.key = binding;
                            document.dispatchEvent(c);
                        }
            }

            for(const [elementID, binding] of mappings) {
                const e = document.getElementById(elementID);
                e.onpointerdown = (event) => {
                    e.releasePointerCapture(event.pointerId); // This is so that events can still be triggered on other elements while moving finger
                    signalKeyDown(binding); // Signal keydown event to all the keys associated with the bindings
                    touchCurrentBinding.set(event.pointerId, binding);
                };
                e.onpointerup = (event)=> {
                    signalKeyUp(binding);
                    touchCurrentBinding.set(event.pointerId, null);

                    event.stopPropagation();
                }
                document.addEventListener("pointerup", (event) => {
                    const currentBinding = touchCurrentBinding.get(event.pointerId);
                    if(currentBinding) {
                        //Finger not touching any button but released
                        signalKeyUp(currentBinding);
                        touchCurrentBinding.set(event.pointerId, null);
                    }
                });
                e.onpointerenter = (event)=> {

                    const currentBinding = touchCurrentBinding.get(event.pointerId);
                    if(currentBinding && currentBinding != binding) {
                        signalKeyUp(currentBinding);
                        touchCurrentBinding.set(event.pointerId, binding);
                    }

                    signalKeyDown(binding);

                }
            }        
        }

        mapTouchToKeys([["accelerate-button", input.upBinding],
        ["brake-button", input.downBinding]]);

        mapTouchToKeys([["left-button", input.leftBinding],
        ["right-button", input.rightBinding]]);

        mapTouchToKeys([["left-drift", [input.driftBinding, input.leftBinding]], ["right-drift", [input.driftBinding, input.rightBinding]]]);

        mapTouchToKeys([["spacer", " "]]); // This is for the dead space in the middle of the left/right controls. Recieving input here is still important.

    }

}


