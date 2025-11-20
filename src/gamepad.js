/** Gamepad input handling code
 *
 * Pretty much all of the code is extracted from this web resource:
 * https://developer.mozilla.org/en-US/docs/Games/Techniques/Controls_Gamepad_API
 *
 */

const gamepadAPI = {
    controller: {},
    turbo: false,
    buttons: [
        "A",
        "B",
        "X",
        "Y",
        "LB",
        "RB",
        "LT",
        "RT",
        "Back",
        "Start",
        "LS",
        "RS",
        "DPad-Up",
        "DPad-Down",
        "DPad-Left",
        "DPad-Right",
        "Xbox Guide"
    ],
    buttonsCache: [],
    buttonsStatus: [],
    axesStatus: [],
    connect(evt) {
        gamepadAPI.controller = evt.gamepad;
        gamepadAPI.turbo = true;
        console.log("Gamepad connected.");
    },
    disconnect(evt) {
        gamepadAPI.turbo = false;
        delete gamepadAPI.controller;
        console.log("Gamepad disconnected.");
    },
    update() {
        // Clear the buttons cache
        gamepadAPI.buttonsCache = [];

        // Move the buttons status from the previous frame to the cache
        for (let k = 0; k < gamepadAPI.buttonsStatus.length; k++) {
            gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
        }

        // Clear the buttons status
        gamepadAPI.buttonsStatus = [];

        // Get the gamepad object
        const c = gamepadAPI.controller || {};

        // Loop through buttons and push the pressed ones to the array
        const pressed = [];
        if (c.buttons) {
            for (let b = 0; b < c.buttons.length; b++) {
                if (c.buttons[b].pressed) {
                    pressed.push(gamepadAPI.buttons[b]);
                }
            }
        }

        // Loop through axes and push their values to the array
        const axes = [];
        if (c.axes) {
            for (const ax of c.axes) {
                axes.push(ax.toFixed(2));
            }
        }

        // Assign received values
        gamepadAPI.axesStatus = axes;
        gamepadAPI.buttonsStatus = pressed;

        // Return buttons for debugging purposes
        return pressed;
    },
    buttonPressed(button, hold) {
        let newPress = false;
        if (!gamepadAPI.controller) {
            return newPress;
        }
        if (gamepadAPI.buttons.includes(button)) {
            newPress = true;
        }
        if (!hold && gamepadAPI.buttons.includes(button)) {
            newPress = false;
        }
        return newPress;
    },
};

window.addEventListener("gamepadconnected", gamepadAPI.connect);
window.addEventListener("gamepaddisconnected", gamepadAPI.disconnect);
