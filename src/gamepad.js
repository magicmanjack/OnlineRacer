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

    buttonPressedStates: new Map([
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

    buttonReleasedStates: new Map([
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

    triggerValues: new Map([
        ["LT", 0],
        ["RT", 0],
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

            // Update axes
            for (let i = 0; i < this.axes.length; i++) {
                this.axes[i] = activeGamepad.axes[i];
            }

            // Update button states
            for (let i = 0; i < this.buttons.length; i++) {
                let buttonChangedState = false;

                // Check for a button press or release
                if (this.buttons[i] !== activeGamepad.buttons[i].pressed) {
                    console.log(this.buttonMappings.get(i) + " changed from " + this.buttons[i] + " to " + activeGamepad.buttons[i].pressed);

                    // If changing to true, else changing to false
                    if (activeGamepad.buttons[i].pressed) {
                        this.buttonPressedStates.set(this.buttonMappings.get(i), activeGamepad.buttons[i].pressed);
                        this.buttonReleasedStates.set(this.buttonMappings.get(i), false);
                    } else {
                        this.buttonPressedStates.set(this.buttonMappings.get(i), false);
                        this.buttonReleasedStates.set(this.buttonMappings.get(i), activeGamepad.buttons[i].pressed);
                    }

                    buttonChangedState = true;
                }

                if (!buttonChangedState) {
                    this.buttonPressedStates.set(this.buttonMappings.get(i), false);
                    this.buttonReleasedStates.set(this.buttonMappings.get(i), false);
                }

                this.buttons[i] = activeGamepad.buttons[i].pressed;

                this.buttonStates.set(
                    this.buttonMappings.get(i),
                    this.buttons[i]
                );

                // Update trigger values if pressed
                if (i == 6 || i == 7) {
                    this.triggerValues.set(this.buttonMappings.get(i), activeGamepad.buttons[i].value);
                }
            }
        } else {
            return;
        }
    },

    isHeld(button) {
        return this.buttonStates.get(button);
    },

    isPressed(button) {
        return this.buttonPressedStates.get(button);
    },
    
    isReleased(button) {
        return this.buttonReleasedStates.get(button);
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
    },

    getLeftTriggerValue() {
        return this.triggerValues.get("LT");
    },

    getRightTriggerValue() {
        return this.triggerValues.get("RT");
    }
};