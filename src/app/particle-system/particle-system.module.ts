import { NgModule, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import * as Spline from 'cubic-spline';
import * as THREE from "three";

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class ParticleSystem {

  private VS = `
    uniform float pointMultiplier;
    attribute float size;
    attribute float angle;
    attribute vec4 colour;
    varying vec4 vColour;
    varying vec2 vAngle;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = size * 100.0 / gl_Position.w;
      vAngle = vec2(cos(angle), sin(angle));
      vColour = colour;
    }`;

  private FS = `
    uniform sampler2D diffuseTexture;
    varying vec4 vColour;
    varying vec2 vAngle;
    void main() {
      vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
      gl_FragColor = texture2D(diffuseTexture, (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5);
      gl_FragColor = gl_FragColor * vColour;
    }`;


  constructor(
    @Inject('params') params: any 
    ) {
    this.camera = params.camera;
    this.parent = params.parent;
    this.maxNumParticles = params.maxNumParticles;
    this.particleGenerationMaxSpeed = params.particleGenerationMaxSpeed;

    const uniforms = {
        diffuseTexture: {
          value: new THREE.TextureLoader().load('../assets/textures/particles/flame_1_S.jpg',
          (texture) => { console.log("texture loaded"); console.log(texture)},
          undefined,
          (err) => { console.log("Failed to load texture. "); console.log(err);})
        },
    };

    this.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: this.VS,
        fragmentShader: this.FS,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        vertexColors: true
    });

    this.particles = [];

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
    this.geometry.setAttribute('colour', new THREE.Float32BufferAttribute([], 4));
    this.geometry.setAttribute('angle', new THREE.Float32BufferAttribute([], 1));

    this.points = new THREE.Points(this.geometry, this.material);

    this.parent.add(this.points);

    const xs = [0.0, 0.1, 0.6, 1.0];
    const ys = [0.0, 1.0, 1.0, 0.0];
    this.alphaSpline = new Spline(xs, ys);

    this.updateGeometry();
  }

  public addParticles(timeElapsed) {
    for (let i = 0; i < this.particleGenerationMaxSpeed; i++) {
      if(this.maxNumParticles <= this.particles.length) {
        break;
      }
      const life = (Math.random() * 0.75 + 0.25);
      const baseColor = new THREE.Color(0.04, 0.08, Math.random() * 0.5 + 0.5)
      this.particles.push({
          position: new THREE.Vector3(
            ( Math.random() * 2 - 1 ) * 0.5,
            ( Math.random() * 2 - 1 ) * 0 - 2,
            ( Math.random() * 2 - 1 ) * 0.5),
          size: (Math.random() * 0.5 + 0.5) * 0.010,
          colour: baseColor,
          baseColor: baseColor,
          alpha: 1.0,
          life: life,
          maxLife: life,
          rotation: Math.random() * 2.0 * Math.PI,
          velocity: new THREE.Vector3(0, 5, 0),
      });
    }
  }

  public updateGeometry(): void {
    const positions = [];
    const sizes = [];
    const colours = [];
    const angles = [];

    for (let p of this.particles) {
      positions.push(p.position.x, p.position.y, p.position.z);
      colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
      sizes.push(p.currentSize);
      angles.push(p.rotation);
    }

    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    this.geometry.setAttribute('colour', new THREE.Float32BufferAttribute(colours, 4));
    this.geometry.setAttribute('angle', new THREE.Float32BufferAttribute(angles, 1));
  
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.colour.needsUpdate = true;
    this.geometry.attributes.angle.needsUpdate = true;
  }

  updateParticles(dt) {
    // TODO: move out scaling
    dt /= 10000.0;

    this.updateParticleLife(dt);
    this.removeDeadParticles();

    for (let p of this.particles) {
      const t = 1.0 - p.life / p.maxLife;

      p.alpha = 0.08 - (0.08 * t);
      p.currentSize = (1.0 - t) * p.size * 500.0 ;
      p.colour = p.baseColor.clone().multiplyScalar(1.0 - t);

      this.updateParticlePosition(p, dt);
    }

    this.particles.sort((a, b) => {
      const d1 = this.camera.position.distanceToSquared(a.position);
      const d2 = this.camera.position.distanceToSquared(b.position);
      return d1 < d2 ? 1 : d2 < d1 ? -1 : 0;
    });
  }

  public updateParticleLife(dt) {
    for(let p of this.particles) {
      p.life -= dt;
    }
  }

  public removeDeadParticles() {
    this.particles = this.particles.filter(p => {
      return p.life > 0.0;
    });
  }

  public updateParticlePosition(p, dt) {
    p.position.add(p.velocity.clone().multiplyScalar(dt));
    const drag = p.velocity.clone();
    drag.multiplyScalar(dt * 0.1);
    drag.x = Math.sign(p.velocity.x) * Math.min(Math.abs(drag.x), Math.abs(p.velocity.x));
    drag.y = Math.sign(p.velocity.y) * Math.min(Math.abs(drag.y), Math.abs(p.velocity.y));
    drag.z = Math.sign(p.velocity.z) * Math.min(Math.abs(drag.z), Math.abs(p.velocity.z));
  }

  public update(dt) {
    this.addParticles(dt);
    this.updateParticles(dt);
    this.updateGeometry();
  }

  private geometry: THREE.BufferGeometry;
  // private material: THREE.ShaderMaterial;
  private material: THREE.Material;

  public points: THREE.Points;
  private maxNumParticles: Number;
  private particleGenerationMaxSpeed: Number;
  private particles: Array<any>;

  private alphaSpline: Spline;
  private colourSpline: Spline;
  private sizeSpline: Spline;
  
  private parent: any;
  private camera: THREE.Camera;
}
