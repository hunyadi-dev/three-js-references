import { Component, AfterViewInit, OnDestroy, NgZone, ViewChild, ElementRef } from "@angular/core";
import * as THREE from "three";
import * as dat from 'dat.gui';
import Stats from "stats.js";

@Component({
  selector: "app-memory-test",
  templateUrl: "./memory-test.component.html",
  styleUrls: ["./memory-test.component.sass"]
})
export class MemoryTestComponent implements AfterViewInit, OnDestroy {

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
    // console.log("Disposing geometry");
    this.sphere.geometry.dispose();
    // console.log("Disposing material");
    this.disposeMaterial(this.sphere.material);
    while(this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]); 
    }
    // console.log(this.renderer.info.memory);
    this.renderer.dispose();
    this.gui.destroy();
    delete this.gui;
    delete this.stats;
    delete this.sphere.geometry;
    delete this.sphere.material;
    delete this.sphere;
    delete this.sunLight;
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
    this.camera.position.z = 5;

    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(2, 300, 300),
      new THREE.MeshPhongMaterial({color: 0x0044ff}));
    this.scene.add(this.sphere);

    this.sunLight = new THREE.PointLight(0xffffff, 3, 0, 2);
    this.sunRevolutionAngle = 0;
    this.sunLight.position.set(Math.cos(this.sunRevolutionAngle) * 20, 6, 20 * Math.sin(this.sunRevolutionAngle));
    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight( 0xccffff, 0.15);
    this.ambientLight.position.set(5, 2, 4);
    this.scene.add(this.ambientLight);
    this.control = { pointlightAngularSpeed: 0.02 }
    this.gui = new dat.GUI({ autoPlace: false });
    this.gui.add(this.control, "pointlightAngularSpeed", -0.10, 0.10, 0.001);
    let customContainer = document.getElementById("controller").appendChild(this.gui.domElement);

    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '2px';
    this.stats.domElement.style.top = '2px';
    document.getElementById("stats").append(this.stats.domElement);
    // customContainer.appendChild(this.gui.domElement);

  }

  private startRenderingLoop(): void {
    this.renderingStopped = false;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
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
      this.animateCube();
      this.stats.update();
      // this.stats.begin();
      this.renderer.render(this.scene, this.camera);
      // this.stats.end()
      return;
    }
    this.renderPromise.then(this.renderLoop.bind(this, now - (delta % interval), interval));
  }

  private getAspectRatio() {
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  private animateCube() {
    // this.sphere.rotation.x += 0.01;
    this.sphere.rotation.y += 0.005;

    this.sunRevolutionAngle += this.control.pointlightAngularSpeed;
    if(Math.PI * 2 < this.sunRevolutionAngle) {
      this.sunRevolutionAngle -= Math.PI * 2;
    }
    this.sunLight.position.set(Math.cos(this.sunRevolutionAngle) * 20, 6, 20 * Math.sin(this.sunRevolutionAngle));
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  @ViewChild("canvas") private canvasRef: ElementRef;

  private renderingStopped: Boolean;
  private renderPromise: Promise<Number>;
  private gui: dat.GUI;
  private control: any;
  private stats: Stats;

  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private sunLight: THREE.PointLight;
  private ambientLight: THREE.AmbientLight;
  private sphere: THREE.Mesh;

  private sunRevolutionAngle;
}
