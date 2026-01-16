const GRAVITY = -0.1;

const MAX_ROTATE_SPEED = 0.04;

const CAR_ROLL_ANGULAR_ACC = 0.05;
const CAR_YAW_ANGULAR_ACC = 0.05;
const CAR_ROLL_REDUCE_FACTOR = 0.87; // The amount that the roll gets scaled by to red
const CAR_YAW_REDUCE_FACTOR = 0.87;
const MAX_CAR_ROLL = 0.5;
const MAX_CAR_YAW = 0.5;

/*
    carRoll is for the model animation when turning. The car will tilt.
*/
const CAR_HOVER_AMPLITUDE = 0.2; 
//The maximum displacement amplitude of the car in the vertical direction when hovering.
const CAR_HOVER_FREQUENCY = 0.5; // How many oscillations per second.

const TERMINAL_VEL = 35;
const BOOST_TERMINAL_VEL = TERMINAL_VEL * 1.5;
const MAX_REVERSE_VEL = -4;

const MAGNET_TERMINAL_VEL = TERMINAL_VEL / 6;

const ACCELERATION = 0.4;

const FRICTION = 0.2;
const POST_TERMINAL_FRICTION = 0.5; 
/*
    POST_TERMINAL_FRICTION is the friction that occurs if the velocity is greater than terminal,
    in order to bring it down to terminal velocity smoothly.
*/
const MAGNET_FRICTION = POST_TERMINAL_FRICTION * 2;

const BREAK_FRICTION = 0.9;

const DRIFT_FRICTION = 0.15;
const DRIFT_TURN_FACTOR = 1.4;

const WALL_FRICTION = 2.1;
const MIN_DEFLECT_VEL = 8; // The min velocity of the car in order for it to deflect off a wall.

const CAR_MAX_JUMP_VEL = 3.3; // Caps the jump speed to prevent jump being too high.

class Car {
    constructor() {
        this.node = new SceneNode();
        this.velocityXZ = 0;
    }
};