const GRAVITY = -0.05;

const MAX_ROTATE_SPEED = 0.04;

const CAR_ROLL_ANGULAR_ACC = 0.025;
const CAR_YAW_ANGULAR_ACC = 0.025;
const CAR_ROLL_REDUCE_FACTOR = 0.93; // The amount that the roll gets scaled by to red
const CAR_YAW_REDUCE_FACTOR = 0.93;
const MAX_CAR_ROLL = 0.5;
const MAX_CAR_YAW = 0.5;
const MAX_CAR_PITCH = 0.1;

/*
    carRoll is for the model animation when turning. The car will tilt.
*/
const CAR_HOVER_AMPLITUDE = 0.2; 
//The maximum displacement amplitude of the car in the vertical direction when hovering.
const CAR_HOVER_FREQUENCY = 0.5; // How many oscillations per second.

const TERMINAL_VEL = 25;
const BOOST_TERMINAL_VEL = TERMINAL_VEL * 1.5;
const MAX_REVERSE_VEL = -2;

const MAGNET_TERMINAL_VEL = TERMINAL_VEL / 3;

const ACCELERATION = 0.4;

const FRICTION = 0.04;
const POST_TERMINAL_FRICTION = 0.45; 
/*
    POST_TERMINAL_FRICTION is the friction that occurs if the velocity is greater than terminal,
    in order to bring it down to terminal velocity smoothly.
*/
const MAGNET_FRICTION = POST_TERMINAL_FRICTION * 4;

const BREAK_FRICTION = 0.45;

const DRIFT_FRICTION = 0.38;
const DRIFT_TURN_FACTOR = 1.8;

const WALL_FRICTION = 1;
const MIN_DEFLECT_VEL = 4; // The min velocity of the car in order for it to deflect off a wall.

const SPINOUT_FRICTION = 0.55;

const CAR_MAX_JUMP_VEL = 1.55; // Caps the jump speed to prevent jump being too high.

class Car {
    constructor() {
        this.node = new SceneNode();
        this.velocityXZ = 0;
        this.velocityVec = [0, 0, 0];
        this.drifting = false;
    }
};