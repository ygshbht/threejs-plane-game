import { AudioListener, Audio, PositionalAudio, AudioLoader } from "three";
import * as Three from "three";
class SFX {
	listener: any;
	assetsPath: string;
	sounds: any;
	constructor(
		camera: Three.Object3D,
		assetsPath: string,
		listener: any = null
	) {
		if (listener == null) {
			this.listener = new AudioListener();
			camera.add(this.listener);
		} else {
			this.listener = listener;
		}

		this.assetsPath = assetsPath;

		this.sounds = {};
	}

	load(name: string, loop = false, vol = 0.5, obj: Three.Mesh | null = null) {
		// create a global audio source
		const sound =
			obj == null
				? new Audio(this.listener)
				: new PositionalAudio(this.listener);

		this.sounds[name] = sound;

		// load a sound and set it as the Audio object's buffer
		const audioLoader = new AudioLoader().setPath(this.assetsPath);
		// console.log(this.assetsPath + name);
		audioLoader.load(`${name}.mp3`, (buffer) => {
			sound.setBuffer(buffer);
			sound.setLoop(loop);
			sound.setVolume(vol);
		});

		if (obj !== null) obj.add(sound);
	}

	setVolume(name: string, volume: number) {
		const sound = this.sounds[name];

		if (sound !== undefined) sound.setVolume(volume);
	}

	setLoop(name: string, loop: any) {
		const sound = this.sounds[name];

		if (sound !== undefined) sound.setLoop(loop);
	}

	play(name: string) {
		const sound = this.sounds[name];

		if (sound !== undefined && !sound.isPlaying) sound.play();
	}

	stop(name: string) {
		const sound = this.sounds[name];

		if (sound !== undefined && sound.isPlaying) sound.stop();
	}

	stopAll() {
		for (let name in this.sounds) this.stop(name);
	}

	pause(name: string) {
		const sound = this.sounds[name];

		if (sound !== undefined) sound.pause();
	}
}

export { SFX };
