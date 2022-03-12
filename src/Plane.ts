import { Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as Three from "three";

class Plane {
	assetsPath: string;
	loadingBar: any;
	game: typeof window.game;
	scene: typeof window.game.scene;
	tmpPos = new Vector3();
	plane: Three.Group | undefined;
	ready: boolean = false;
	velocity: Three.Vector3 | undefined;
	propeller: Three.Object3D | undefined;
	constructor(game: typeof window.game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.game = game;
		this.scene = game.scene;
		this.load();
	}

	get position() {
		if (this.plane !== undefined) this.plane.getWorldPosition(this.tmpPos);
		return this.tmpPos;
	}

	set visible(mode: any) {
		if (this.plane) this.plane.visible = mode;
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}plane/`);
		this.ready = false;

		// Load a glTF resource
		loader.load(
			// resource URL
			"microplane.glb",
			// called when the resource is loaded
			(gltf) => {
				this.scene.add(gltf.scene);
				this.plane = gltf.scene;
				this.velocity = new Vector3(0, 0, 0.1);

				this.propeller = this.plane.getObjectByName("propeller");

				this.ready = true;
			},
			// called while loading is progressing
			(xhr) => {
				this.loadingBar.update("plane", xhr.loaded, xhr.total);
			},
			// called when loading has errors
			(err) => {
				console.error(err);
			}
		);
	}

	reset() {
		if (!this.plane || !this.velocity) return;
		this.plane.position.set(0, 0, 0);
		this.plane.visible = true;
		this.velocity.set(0, 0, 0.1);
	}

	update(time: number) {
		if (this.propeller !== undefined) this.propeller.rotateZ(1);

		if (this.game.active) {
			if (!this.velocity || !this.plane) return;
			if (!this.game.spaceKey) {
				this.velocity.y -= 0.001;
			} else {
				this.velocity.y += 0.001;
			}

			this.velocity.z += 0.0001;
			this.plane.rotation.set(0, 0, Math.sin(time * 3) * 0.2, "XYZ");
			this.plane.translateZ(this.velocity.z);
			this.plane.translateY(this.velocity.y);
		} else {
			if (!this.plane) return;
			this.plane.rotation.set(0, 0, Math.sin(time * 3) * 0.2, "XYZ");
			this.plane.position.y = Math.cos(time) * 1.5;
		}
	}
}

export { Plane };
