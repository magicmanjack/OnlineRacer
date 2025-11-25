# Online racing game

## How to run:
First of all you need to install deno. Follow the installation instructions at https://deno.com/. Then run this command in the project root directory:
```
    deno run --allow-read=. --allow-net=0.0.0.0:5174 server/server.js  
```
This will start the server on the localhost. Open up your browser of choice and enter the link 0.0.0.0

## Ingame snapshots:
<img width="1593" height="1050" alt="Screenshot 2025-08-15 at 12 52 32 AM" src="https://github.com/user-attachments/assets/a99887ed-db39-4739-a071-3ee6953f7f6d" />
<img width="1625" height="916" alt="Screenshot 2025-08-15 at 12 54 49 AM" src="https://github.com/user-attachments/assets/8fdba23f-57d1-4691-b5ea-840e633dee2c" />

## How to make tracks (in Blender):
When creating objects, if scaling the object, make sure to apply the scaling to the mesh data so that the scaling is represented as 1.0. This is because the game is unable to extract the scaling from a transformation 
matrix yet. This is just a workaround to the problem and not a permanent fix.

Export models to .FBX and in the export settings:
- set path mode to relative (This is for textures to work).
- set Forward -Z foward (To convert between blenders coordinate system and the games).
- set Up to Y up. (To convert between blenders coordinate system and the games).


To make objects collidable (so the car cannot pass through them) you must add a collider to it. How to do this is explained below. A collider must be a 2D shape, and orientated to be in the x-z plane, as the collision detection uses simple 2D SAT collision in the x-z plane.

To create special objects (objects that have different functionality in the game) you must name the object with one of the prefixes below. There is no rules on how the object should be shaped or textured however.


Special object name prefixes:
- 'collider' creates a collider plane.
- 'boost' creates a speed boost object. Must have a childed collider.
- 'checkpoint' followed by a number in the form of '.000'. A checkpoint is a plane that spans the width of the race track. The checkpoint registers when a car passes through it and is essential for the start/finish line to function properly.
- 'magnetpad'. Must have a childed collider.
- 'ramp' creates a ramp. Must have childed collider.
- 'startline' creates a start line. Must have a childed collider.
- 'solid' means a solid object that will stop the car. Must have a childed collider.

