function init() {

    function showHUD() {
        const HUD = document.getElementById('ui-overlay');
        HUD.style.display = "block";
    }

    function hideHUD() {
        const HUD = document.getElementById('ui-overlay');
        HUD.style.display = "none";
    }

    loadMenu();
    //loadTrack1();

}

function loadMenu() {
    // Initialize camera with proper aspect ratio
    const canvas = document.getElementById('c');
    const aspectRatio = canvas.width / canvas.height;
    Camera.main.displayHeight = 25;
    Camera.main.displayWidth = 25 * aspectRatio;

    const car = new SceneNode();
    car.translation = [0, -25, -80];
    car.scale = [5, 5, 5];
    car.update = () => {
        car.rotate(0, 0.025, 0);
    }
    //car.translation
    car.addMesh(["models/car.obj", "models/car.mtl"]);

    const backdrop = new SceneNode();
    backdrop.addMesh(["models/backdrop.fbx"]);
    backdrop.translation = [0, -35, -80]
    backdrop.scale = [0.2, 0.2, 0.2];

    const background = new SceneNode();
    background.addMesh(["models/menubackground.fbx"]);
    background.translation = [0, -20, -80];
    background.scale = [2, 2, 2];
    background.update = () => {
        const factor = 0.0625;
        background.rotate(0.05 * factor, 0.025 * factor, 0.0125 * factor);
    };
    
    const b2 = new UIPanel(0, 0, 15, 3, "textures/default.png");
    b2.whenClicked = () => {
        console.log("b2 clicked");
    };
    
    const b1 = new UIPanel(0, -5, 15, 3, "textures/default.png");
    b1.whenClicked = () => {
        console.log("b1 clicked");
    };
    UILayer.push(b2);
    UILayer.push(b1);

    sceneGraph.root.addChild(car);
    sceneGraph.root.addChild(backdrop);
    sceneGraph.root.addChild(background);
}