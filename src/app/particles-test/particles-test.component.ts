import { Component, AfterViewInit, OnDestroy, NgZone, ViewChild, ElementRef } from "@angular/core";
import { ParticleSystem } from '../particle-system/particle-system.module';
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'dat.gui';
import Stats from "stats.js";

@Component({
  selector: "app-particles-test",
  templateUrl: "./particles-test.component.html",
  styleUrls: ["./particles-test.component.sass"]
})
export class ParticlesTestComponent implements AfterViewInit, OnDestroy {

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.createScene();
    this.ngZone.runOutsideAngular(this.startRenderingLoop.bind(this));
  }

  private disposeMaterial(material: (THREE.Material | THREE.Material[])): void {
    if(Array.isArray(material)) {
      material.forEach(material => material.dispose());
      return;
    }
    material.dispose();
  }

  private performCleanup(): void {
    while(this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]); 
    }
    this.renderer.dispose();
    this.orbitControls.dispose();
    delete this.stats;
    delete this.scene;
    delete this.renderer;
  }

  ngOnDestroy(): void {
    this.renderingStopped = true;
    this.renderPromise.then(this.performCleanup.bind(this));
  }

  private createScene(): void {
    if(this.scene) {
      return;
    }
    this.scene = new THREE.Scene();
    const aspectRatio = this.getAspectRatio();
    this.camera = new THREE.PerspectiveCamera(70, aspectRatio, 1, 1000);
    this.camera.position.x = 2.5;
    this.camera.position.y = -2.5;
    this.camera.position.z = 2.5;

    this.particleSystem = new ParticleSystem({ 
      parent: this.scene,
      camera: this.camera,
      maxNumParticles: 25000,
      particleGenerationMaxSpeed: 300
    });

    this.sunLight = new THREE.PointLight(0xffffff, 3, 0, 2);
    this.sunRevolutionAngle = 0;
    this.sunLight.position.set(Math.cos(this.sunRevolutionAngle) * 20, 6, 20 * Math.sin(this.sunRevolutionAngle));
    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight( 0xccffff, 0.15);
    this.ambientLight.position.set(5, 2, 4);
    this.scene.add(this.ambientLight);

    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '2px';
    this.stats.domElement.style.top = '2px';
    document.getElementById("stats").append(this.stats.domElement);
  }

  private startRenderingLoop(): void {
    this.renderingStopped = false;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    const fps = 30;
    const interval = 1000 / fps;
    this.renderLoop(Date.now(), interval);
  }

  private renderLoop(previousFrameTime, interval) {
    if(this.renderingStopped) {
      return;
    }
    const now = Date.now();
    const delta = now - previousFrameTime;
    this.renderPromise = new Promise(requestAnimationFrame);
    if (delta > interval) {
      this.renderPromise.then(this.renderLoop.bind(this, now, interval));
      this.orbitControls.update();
      this.particleSystem.update(delta);
      this.stats.update();
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.renderPromise.then(this.renderLoop.bind(this, now - (delta % interval), interval));
  }

  private getAspectRatio() {
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  @ViewChild("canvas") private canvasRef: ElementRef;

  private renderingStopped: Boolean;
  private renderPromise: Promise<Number>;
  private stats: Stats;
  private orbitControls: OrbitControls;

  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private sunLight: THREE.PointLight;
  private ambientLight: THREE.AmbientLight;
  private particleSystem: ParticleSystem;

  private sunRevolutionAngle;
}
