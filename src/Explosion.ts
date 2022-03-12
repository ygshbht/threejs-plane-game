import {
	IcosahedronGeometry,
	TextureLoader,
	ShaderMaterial,
	Mesh,
	ShaderChunk,
} from "three";
import * as Three from "three";
import { noise } from "./libs/Noise.js";
import { Tween } from "./libs/Toon3D.js";

class Explosion {
	static vshader = `
#include <noise>

uniform float u_time;

varying float noise;

void main() {	
  float time = u_time;
  float displacement;
  float b;
  
  // add time to the noise parameters so it's animated
  noise = 10.0 *  -.10 * turbulence( .5 * normal + time );
  b = 5.0 * pnoise( 0.05 * position + vec3( 2.0 * time ), vec3( 100.0 ) );
  displacement = - 10. * noise + b;

  // move the position along the normal and transform it
  vec3 newPosition = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}
`;
	static fshader = `
#define PI 3.141592653589
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_opacity;
uniform sampler2D u_tex;

varying float noise;

//	<https://www.shadertoy.com/view/4dS3Wd>
//	By Morgan McGuire @morgan3d, http://graphicscodex.com

//https://www.clicktorelease.com/blog/vertex-displacement-noise-3d-webgl-glsl-three-js/

float random( vec3 scale, float seed ){
  return fract( sin( dot( gl_FragCoord.xyz + seed, scale ) ) * 43758.5453 + seed ) ;
}

void main() {

  // get a random offset
  float r = .01 * random( vec3( 12.9898, 78.233, 151.7182 ), 0.0 );
  // lookup vertically in the texture, using noise and offset
  // to get the right RGB colour
  vec2 t_pos = vec2( 0, 1.3 * noise + r );
  vec4 color = texture2D( u_tex, t_pos );

  gl_FragColor = vec4( color.rgb, u_opacity );
}
`;
	obstacles: any;
	uniforms: any = {};
	ball: Three.Mesh | undefined;
	tweens: any[] = [];
	active: boolean = true;
	constructor(parent: Three.Object3D, obstacles: any) {
		const geometry = new IcosahedronGeometry(20, 4);

		this.obstacles = obstacles;

		this.uniforms = {
			u_time: { value: 0.0 },
			u_mouse: { value: { x: 0.0, y: 0.0 } },
			u_opacity: { value: 0.6 },
			u_resolution: { value: { x: 0, y: 0 } },
			u_tex: {
				value: new TextureLoader().load(
					`${window.game.assetsPath}plane/explosion.png`
				),
			},
		};

		ShaderChunk.noise = noise;

		const material = new ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: Explosion.vshader,
			fragmentShader: Explosion.fshader,
			transparent: true,
			opacity: 0.6,
		});

		this.ball = new Mesh(geometry, material);
		const scale = 0.05;
		this.ball.scale.set(scale, scale, scale);
		parent.add(this.ball);

		this.tweens = [];
		this.tweens.push(
			new Tween(
				this.ball.scale,
				"x",
				0.2,
				1.5,
				this.onComplete.bind(this),
				"outQuad"
			)
		);

		this.active = true;
	}

	onComplete() {
		if (this.ball) {
			this.ball.parent?.remove(this.ball);
			this.tweens = [];
			this.active = false;
			this.ball.geometry.dispose();
			// this.ball.material.dispose();
			if (this.obstacles) this.obstacles.removeExplosion(this);
		}
	}

	update(time: number) {
		if (!this.active) return;

		this.uniforms.u_time.value += time;
		if (this.ball) {
			const mat = this.ball.material as any;
			this.uniforms.u_opacity.value = mat.opacity;
		}

		if (this.tweens.length < 2) {
			const elapsedTime = this.uniforms.u_time.value - 1;

			if (elapsedTime > 0 && this.ball) {
				this.tweens.push(new Tween(this.ball.material, "opacity", 0, 0.5));
			}
		}

		this.tweens.forEach((tween) => {
			tween.update(time);
		});
		if (this.ball) {
			this.ball.scale.y = this.ball.scale.z = this.ball.scale.x;
		}
	}
}

export { Explosion };
