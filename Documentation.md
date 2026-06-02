# How to use the classes and functions
## The scene graph
Pretty much every mesh that you see rendered is attached to a scene node which is on the scene graph heiarchy. (The exception is UI). The scene graph allows you to apply a transformation to a node and have the same transformation apply to all children nodes. (Think about local rotations in blender). Nodes can attach a mesh, and also have different properties affecting the functionality of the node.
Here is an example:
```
const player = new SceneNode();
//Fine grained collision means that the collision checking method is more continous over discrete.
player.fineGrainedCollision = true;
player.fineGrainedCollisionInterval = 0.2;

//Attach a mesh to the node.
player.addMesh(["models/car.fbx"]);

//Now to attach the player to the sceneGraph
sceneGraph.root.addChild(player);
```
You can attach SceneNodes to SceneNodes using the addChild(node) method seen above.

If you want to start over and clear everything (including UI) you use this commmand:
```
sceneGraph.reset();
```
### Movement
If you want to move SceneNodes around:
```
player.translation = [1, 2, 3]; // x, y, z translation
//Or
player.rotation = [1, 2, 3]; // x, y, z axis rotations
//Or
player.translate(1, 2, 3);
//Or
player.rotate(1, 2, 3);
//Or
player.scale = [1, 2, 3];
//Or
player.scaleBy(2);

```
### Update loop
If you want to add a scene node into the update loop:

```
player.update = () => {
    if(input.left) {
        //moves the player to the left of a left key press
        player.translate(-1, 0, 0);
    }
}
```
### More advanced movements
If you want to **rotate** in a scene nodes local coordinate system:
```
player.rotateLocal(1, 2, 3);
```

If you want to **rotate around** an abritrary axis:
```
// Rotates 90 degrees around the [1, 0, 0] axis or the x axis
player.rotateOnAxis([1, 0, 0], Math.PI/2);
```
If you want to **linearly interpolate** a nodes position to another nodes position.
```
// Moves 50% of the way (0.5)
player.moveTowards(otherPlayer.translation, 0.5);
// Or if you want to specify the position manually
player.moveTowards([1, 2, 3], 0.5);
```
If you want to **linearly interpolate a nodes rotation** to another nodes rotation(SLERP):
```
// Rotates 50% of the way
player.rotateTowards(otherPlayer.rotation, 0.5);
// Or if you want to specify the rotation manually
player.rotateTowards([1, 2, 3], 0.5);
```
### Attaching meshes
You can add a mesh to a scene node like this:
```
player.addMesh(["models/car.fbx"]);
```
*Note: the reason why the array as an argument is because sometimes there are more than one file associated with a model such as when using object (.obj) files with material files (.mtl)*

You can make a mesh transparent by giving it transparent textures and then marking it as transparent:
```
player.transparent = true;
```
*Note: This is needed because the mesh gets rendered differently if it is transparent. The current implementation of transparency is also limited. If you are to place a transparent object behind another this is likely to not work well.*
## UI
You can create a rectangular UI component and set its background image easily with:
```
    const x = 0;
    const y = 0;
    const w = 5;
    const h = 5;

    const ui = new UIPanel(x, y, w, h, ["image.png"]);
    UILayer.push(ui); // You must push to UILayer in order to render the ui
    
```
*Note the ui is centered on the provided x and y value. Also note the coordinate space. The UI is rendered at close to the zNear clipping plane of the camera frustrum, so the coordinate space will almost map to the rectangle defined by Camera.main.displayWidth and Camera.main.displayHeight*

### Transparency
If you want to make the UI transparent you must specify this like so:
```
ui.transparent = true;
```
*Note: the ui texture must contain transparent values for this to work*

### Text
If you want to add text into your UI:
```
ui.addText("Here is some text", "Verdana", "black")
```

## Particle effects!
The game implements a particle generator. You can set the texture of the particles and the different properties such as emit
You can attach a particle generator to a scene node like this:
```     
    boosterEmitter = new ParticleGenerator("/textures/car/booster_2.png");
    boosterEmitter.maxParticles = 100; // The maximum amount of particles that can exist in one moment
    boosterEmitter.emitAmount = 3; // The amount of particles emitted in each iteration
    boosterEmitter.enable = false; // If enable is false, the generator is not emitting anything
    boosterEmitter.interpolate = true; 
```
*Note: The interpolate property is for when your scene node is moving around quickly and you are trying to make a stream like emittance. The example here is for the car booster tail stream. Without this, the stream would be broken in to segments when the car moves faster. However this is more process intensive. For objects that do not move, don't use interpolate*

You can control the movement and size of the particles by setting certain functions of generator:

```
boosterEmitter.particleInit = (p) => {
    /*
    In here you can set properties for a particle when they are first created.
    There are 4 properties you can play with:
    1. p.position is the 3d vector [x, y, z] position of the particle. The default value is the emitters current position
    2. p.velocity is the initial velocity of the particle as a 3d vector [x, y, z]
    3. p.size is the initial size of the particle as a 2d vector of scale values [x, y]. The default is [1, 1]
    4. p.ttl is the "time to live" of the particle in terms of updates. When ttl = 0, the particle is destroyed. The default value is -1 which means the particle should exist permanently (until maxParticles is reached and then the oldest particles are culled
    */
}

boosterEmitter.particleUpdate = (p) => {
    /*
    This function is called every update.
    You can affect the same properties which are shown in particleInit above. Here is an example which makes the particles accelerate downwards with a constant gravity value.
    */
    const gravity = -0.5;
    p.velocity = vec.add(p.velocity, [0, gravity, 0]);
}

```

## Audio
You can add audio into the game by loading it in, then signalling to play or stop. For example:
```
const audioObject = audio.loadAudio("sounds/sound.mp3");
audioObject.start();

// Some time goes by 

audioObject.stop();
```
There is a important feature to now about from the above. Calling start() while there is already an instance of the sound playing, will create a new instance of the sound and play it. So you can play the same sound multiple times simultaneously, without having to fetch the sound over the network again. Note however, calling stop() will only stop the most recently created instance of the sound. This functionality is useful for when you want to play a new instance of the sound easily without interrupting the previous instance. E.g.
```
//Inside update loop so repeating 30 times a second

if(input.up) {
    //The previous instance of the sound is unlikely to be finished
    audioObject.play();
} 
```

# How to make tracks (in Blender)

## Export settings:
Blender uses a different coordinate system then the game. In order to make sure models imported correctly you must do the following:
- set Forward -Z forward.
- set Up to Y up.

Also for textures to work you must set path mode to 'relative'.

Preferably export as '.fbx' because this has been tested and works.

## How to make collidable objects
To make objects collidable in blender (so the car cannot pass through them), you must add a collider as a child to the object. The collider must be a 2D shape named with the prefix 'collider', and oriented so the flat side is up. The reason for this is the game uses 2D SAT collision. There is no "up and down" collision. There are different types of collidable objects recognised by the engine. E.g. solid objects where the car cannot pass through, and checkpoint objects that keep track of the car completing a lap. 

To distinguish between the types of collision you must name the parent object with one of the prefixes below. There is no rules on how the object should be shaped or textured however.

Special object name prefixes:
- `boost` creates a speed boost object. Must have a childed collider.
- `checkpoint` followed by a number in the form of '.000'. A checkpoint is a plane that spans the width of the race track. The checkpoint registers when a car passes through it and is essential for the start/finish line to function properly.
- `magnetpad`. Must have a childed collider.
- `ramp` creates a ramp. Must have childed collider.
- `startline` creates a start line. Must have a childed collider.
- `solid` means a solid object that will stop the car. Must have a childed collider.

## Minimaps
For minimaps you must create a minimap mesh in blender. This mesh gets loaded in as the minimap. All you have to do is create a rectangle that perfectly overlays the real map and has the same transformation (so if you were to apply the identiy transform to both they would have an identical outline). Then you  just texture the minimap to however you want it to look.

To load the minimap into the game, you must attach the minimap mesh to a sceneNode. Then you must call 'minimap.create()'. then during gameplay, to update the player position you must call 'minimap.updatePosistion()'. Here is a code excerpt:

```
    const minimapNode = new SceneNode();
    minimapNode.addMesh(["meshfilename.fbx"]);

    //build minimap

    /*
        Because of the implementation of addMesh() we need to do some rearrangments. 
        Because the structure of the node will be like this:
        miniMapNode (no mesh) --> actual object (with mesh)
    */

    const minimapMeshNode = minimapNode.children[0];
    minimapMeshNode.transparent = true;
    sceneGraph.root.addChild(minimapMeshNode);

    /*
        Pre calculating the matrices means that any adjustments made to the ground node 
        gets taken into account when creating the minimap. This means you can rotate
        and the ground node however you like 
    */

    sceneGraph.preCalcMatrices();

    minimap.create(ground, minimapMeshNode);

```