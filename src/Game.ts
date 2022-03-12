import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { LoadingBar } from "./libs/LoadingBar.js";
import { Plane } from "./Plane";
import { Obstacles } from "./Obstacles";
import { SFX } from "./SFX";

class Game {
	loadingBar = new LoadingBar();
	clock = new THREE.Clock();
	assetsPath = "./assets/";
	cameraController = new THREE.Object3D();
	camera = new THREE.PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.01,
		100
	);
	cameraTarget = new THREE.Vector3(0, 0, 6);
	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	active: boolean = false;
	spaceKey = false;
	score: number = 0;
	bonusScore: number = 3;
	lives: number = 3;
	sfx: SFX | undefined;
	plane: Plane | undefined;
	obstacles: Obstacles | undefined;
	loading: boolean = false;
	constructor() {
		const container = document.createElement("div");
		document.body.appendChild(container);

		this.loadingBar.visible = false;

		this.camera.position.set(-4.37, 0, -4.75);
		this.camera.lookAt(0, 0, 6);

		this.cameraController.add(this.camera);

		this.scene.add(this.cameraController);

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
		ambient.position.set(0.5, 1, 0.25);
		this.scene.add(ambient);

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild(this.renderer.domElement);
		this.setEnvironment();

		this.load();

		window.addEventListener("resize", this.resize.bind(this));

		document.addEventListener("keydown", this.keyDown.bind(this));
		document.addEventListener("keyup", this.keyUp.bind(this));

		document.addEventListener("touchstart", this.mouseDown.bind(this));
		document.addEventListener("touchend", this.mouseUp.bind(this));
		document.addEventListener("mousedown", this.mouseDown.bind(this));
		document.addEventListener("mouseup", this.mouseUp.bind(this));

		const btn = document.getElementById("playBtn") as HTMLElement;
		btn.addEventListener("click", this.startGame.bind(this));
	}

	startGame() {
		const gameover = document.getElementById("gameover") as HTMLElement;
		const instructions = document.getElementById("instructions") as HTMLElement;
		const btn = document.getElementById("playBtn") as HTMLElement;

		gameover.style.display = "none";
		instructions.style.display = "none";
		btn.style.display = "none";

		this.score = 0;
		this.bonusScore = 0;
		this.lives = 3;

		let elm = document.getElementById("score") as HTMLElement;
		elm.innerHTML = String(this.score);

		elm = document.getElementById("lives") as HTMLElement;
		elm.innerHTML = String(this.lives);

		this.plane && this.plane.reset();
		this.obstacles && this.obstacles.reset();

		this.active = true;

		// setTimeout(() => {
		this.sfx && this.sfx.play("engine");
		// }, 2500);
	}

	resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	keyDown(evt: KeyboardEvent) {
		switch (evt.key) {
			case " ":
				this.spaceKey = true;
				break;
		}
	}

	keyUp(evt: KeyboardEvent) {
		switch (evt.key) {
			case " ":
				this.spaceKey = false;
				break;
		}
	}

	mouseDown() {
		this.spaceKey = true;
	}

	mouseUp() {
		this.spaceKey = false;
	}

	setEnvironment() {
		const loader = new RGBELoader()
			.setDataType(THREE.UnsignedByteType)
			.setPath(this.assetsPath);
		const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
		pmremGenerator.compileEquirectangularShader();

		const self = this;

		loader.load(
			"hdr/venice_sunset_1k.hdr",
			(texture) => {
				const envMap = pmremGenerator.fromEquirectangular(texture).texture;
				pmremGenerator.dispose();

				self.scene.environment = envMap;
			},
			undefined,
			(err) => {
				console.error(err.message);
			}
		);
	}

	load() {
		this.loadSkybox();
		this.loading = true;
		this.loadingBar.visible = true;
		this.loadSFX();

		this.plane = new Plane(this);
		this.obstacles = new Obstacles(this);

		// this.loadSFX();
	}

	loadSFX() {
		this.sfx = new SFX(this.camera, this.assetsPath + "plane/");

		this.sfx.load("explosion");
		this.sfx.load("engine", true);
		this.sfx.load("gliss");
		this.sfx.load("gameover");
		this.sfx.load("bonus");
	}

	loadSkybox() {
		this.scene.background = new THREE.CubeTextureLoader()
			.setPath(`${this.assetsPath}/plane/paintedsky/`)
			.load(
				["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"],
				() => {
					this.renderer.setAnimationLoop(this.render.bind(this));
				}
			);
	}

	gameOver() {
		this.active = false;

		const gameover = document.getElementById("gameover") as HTMLElement;
		const btn = document.getElementById("playBtn") as HTMLElement;

		gameover.style.display = "block";
		btn.style.display = "block";

		this.plane && (this.plane.visible = false);

		if (this.sfx) {
			this.sfx.stopAll();
			this.sfx.play("gameover");
		}
	}

	incScore() {
		this.score++;

		const elm = document.getElementById("score");

		if (this.score % 3 == 0 && this.sfx) {
			this.bonusScore += 3;
			this.sfx.play("bonus");
		} else {
			this.sfx && this.sfx.play("gliss");
		}

		elm && (elm.innerHTML = String(this.score + this.bonusScore));
	}

	decLives() {
		this.lives--;

		const elm = document.getElementById("lives") as HTMLElement;

		elm.innerHTML = String(this.lives);

		if (this.lives == 0) setTimeout(this.gameOver.bind(this), 1200);

		this.sfx && this.sfx.play("explosion");
	}

	updateCamera() {
		this.plane && this.cameraController.position.copy(this.plane.position);
		this.cameraController.position.y = 0;
		this.plane && this.cameraTarget.copy(this.plane.position);
		this.cameraTarget.z += 6;
		this.camera.lookAt(this.cameraTarget);
	}

	render() {
		if (this.loading) {
			if (
				this.plane &&
				this.plane.ready &&
				this.obstacles &&
				this.obstacles.ready
			) {
				this.loading = false;
				this.loadingBar.visible = false;
			} else {
				return;
			}
		}

		const dt = this.clock.getDelta();
		const time = this.clock.getElapsedTime();

		this.plane && this.plane.update(time);

		if (this.active && this.plane && this.obstacles) {
			this.obstacles.update(this.plane.position, dt);
		}

		this.updateCamera();

		this.renderer.render(this.scene, this.camera);
	}
}

export { Game };

document.addEventListener("DOMContentLoaded", () => {
	const game = new Game();
	window.game = game;
});
declare global {
	interface Window {
		game: any;
	}
}

window.game = window.game || {};
