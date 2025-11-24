/** Gamepad input handling code
 *
 * Pretty much all of the code is extracted from this web resource:
 * https://developer.mozilla.org/en-US/docs/Games/Techniques/Controls_Gamepad_API
 *
 */

let gamepadsState = null;

const currentGamepad = {
    index: null,

    // Assume this is an Xbox 360 Controller for now (17 buttons)
    // PS4/PS5 controllers will have an extra button for the touchpad (18 buttons)
    buttons: [
        false, // A
        false, // B
        false, // X
        false, // Y
        false, // LB
        false, // RB
        false, // LT
        false, // RT
        false, // Back
        false, // Start
        false, // LS
        false, // RS
        false, // DPad-Up
        false, // DPad-Down
        false, // DPad-Left
        false, // DPad-Right
        false, // Xbox Guide
        // false, // PS4/PS5 touchpad
    ],

    buttonMappings: new Map([
        [0, "A"],
        [1, "B"],
        [2, "X"],
        [3, "Y"],
        [4, "LB"],
        [5, "RB"],
        [6, "LT"],
        [7, "RT"],
        [8, "Back"],
        [9, "Start"],
        [10, "LS"],
        [11, "RS"],
        [12, "DPad-Up"],
        [13, "DPad-Down"],
        [14, "DPad-Left"],
        [15, "DPad-Right"],
        [16, "Xbox Guide"],
    ]),

    buttonStates: new Map([
        ["A", false],
        ["B", false],
        ["X", false],
        ["Y", false],
        ["LB", false],
        ["RB", false],
        ["LT", false],
        ["RT", false],
        ["Back", false],
        ["Start", false],
        ["LS", false],
        ["RS", false],
        ["DPad-Up", false],
        ["DPad-Down", false],
        ["DPad-Left", false],
        ["DPad-Right", false],
        ["Xbox Guide", false],
    ]),

    axes: [
        0,
        0,
        0,
        0
    ],

    timestamp: 0,

    update() {
        gamepadsState = navigator.getGamepads();

        const activeGamepad = gamepadsState[this.index];

        if (activeGamepad && activeGamepad.timestamp !== this.timestamp) {
            this.timestamp = activeGamepad.timestamp;

            console.log(activeGamepad);

            // Update axes
            for (let i = 0; i < this.axes.length; i++) {
                this.axes[i] = activeGamepad.axes[i];
            }

            // Update button states
            for (let i = 0; i < this.buttons.length; i++) {
                this.buttons[i] = activeGamepad.buttons[i].pressed;
                this.buttonStates.set(
                    this.buttonMappings.get(i),
                    this.buttons[i]
                );
            }
        } else {
            return;
        }
    },

    isPressed(button) {
        return this.buttonStates.get(button);
    },

    getLeftXAxis() {
        return this.axes[0];
    },

    getLeftYAxis() {
        return this.axes[1];
    },

    getRightXAxis() {
        return this.axes[2];
    },

    getRightYAxis() {
        return this.axes[3];
    }
    //     controller: {},
    //     turbo: false,
    //     buttons: [
    //         "A",
    //         "B",
    //         "X",
    //         "Y",
    //         "LB",
    //         "RB",
    //         "LT",
    //         "RT",
    //         "Back",
    //         "Start",
    //         "LS",
    //         "RS",
    //         "DPad-Up",
    //         "DPad-Down",
    //         "DPad-Left",
    //         "DPad-Right",
    //         "Xbox Guide"
    //     ],
    //     buttonsCache: [],
    //     buttonsStatus: [],
    //     axesStatus: [],
    //     connect(evt) {
    //         gamepadAPI.controller = evt.gamepad;
    //         gamepadAPI.turbo = true;
    //         console.log("Gamepad connected.");
    //     },
    //     disconnect(evt) {
    //         gamepadAPI.turbo = false;
    //         delete gamepadAPI.controller;
    //         console.log("Gamepad disconnected.");
    //     },
    //     update() {
    //         // Clear the buttons cache
    //         gamepadAPI.buttonsCache = [];

    //         // Move the buttons status from the previous frame to the cache
    //         for (let k = 0; k < gamepadAPI.buttonsStatus.length; k++) {
    //             gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
    //         }

    //         // Clear the buttons status
    //         gamepadAPI.buttonsStatus = [];

    //         // Get the gamepad object
    //         const c = gamepadAPI.controller || {};

    //         // Loop through buttons and push the pressed ones to the array
    //         const pressed = [];
    //         if (c.buttons) {
    //             for (let b = 0; b < c.buttons.length; b++) {
    //                 if (c.buttons[b].pressed) {
    //                     pressed.push(gamepadAPI.buttons[b]);
    //                 }
    //             }
    //         }

    //         // Loop through axes and push their values to the array
    //         const axes = [];
    //         if (c.axes) {
    //             for (const ax of c.axes) {
    //                 axes.push(ax.toFixed(2));
    //             }
    //         }

    //         // Assign received values
    //         gamepadAPI.axesStatus = axes;
    //         gamepadAPI.buttonsStatus = pressed;

    //         // Return buttons for debugging purposes
    //         return pressed;
    //     },
    //     buttonPressed(button, hold) {
    //         let newPress = false;
    //         if (!gamepadAPI.controller) {
    //             return newPress;
    //         }
    //         if (gamepadAPI.buttons.includes(button)) {
    //             newPress = true;
    //         }
    //         if (!hold && gamepadAPI.buttons.includes(button)) {
    //             newPress = false;
    //         }
    //         return newPress;
    //     },
};

// window.addEventListener("gamepadconnected", (event) => {
//     console.log("Gamepad connected.");
//     console.log(event.gamepad);
// });

// window.addEventListener("gamepaddisconnected", (event) => {
//     console.log("Gamepad disconnected.");
//     console.log(event.gamepad);
// });
