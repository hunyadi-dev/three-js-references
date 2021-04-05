import { Component, AfterViewInit, NgZone, OnDestroy, ElementRef, ViewChild, Input, HostListener } from '@angular/core';
import * as PIXI from 'pixi.js';
import Stats from "stats.js";

@Component({
  selector: 'app-pixi-particles',
  templateUrl: './pixi-particles.component.html',
  styleUrls: ['./pixi-particles.component.sass']
})
export class PixiParticlesComponent implements AfterViewInit {

  constructor(private ngZone: NgZone) {}
  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(this.init.bind(this));
  }

  @Input()
  public devicePixelRatio = window.devicePixelRatio || 1;

  ngOnDestroy(): void {
    this.app.destroy();
  }

  randn_bm() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return this.randn_bm() // resample between 0 and 1
    return num
  }

  init() {
    this.app = new PIXI.Application({ view: this.canvas });
    this.particleContainer = new PIXI.Container();

    this.app.stage.addChild(this.particleContainer);

    // Create a new texture
    const texture = PIXI.Texture.from("../assets/textures/particles/flame_1_S.jpg");

    this.particleContainer.x = this.app.screen.width / 2;
    this.particleContainer.y = this.app.screen.height / 2;

    this.particles = [];
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '2px';
    this.stats.domElement.style.top = '2px';
    document.getElementById("stats").append(this.stats.domElement);

    function update(dt) {
      this.updateParticles(dt);
      this.generateParticles(texture);
      this.stats.update();
    };

    // Listen for animate update
    this.app.ticker.add(update.bind(this));
  }

  private createParticle(texture) {
    let particle: any;
    const flame = new PIXI.Sprite(texture);
    flame.scale.set(-0.1);
    flame.anchor.set(0.5);
    flame.x = (this.randn_bm() - 0.5) * 300;
    flame.y = 200;
    flame.alpha = 0.03;
    flame.blendMode = PIXI.BLEND_MODES.ADD;
    particle = flame;
    particle.v_y = -Math.random() * 0.8;
    particle.life = this.minParticleLife + Math.random() * (this.maxParticleLife - this.minParticleLife);
    return particle;
  }

  private generateParticles(texture) {
    for (let i = 0; i < this.particleGenerationMaxSpeed; i++) {
      if(this.maxNumParticles <= this.particles.length) {
        // console.log(particles.length);
        break;
      }
      const flame = this.createParticle(texture);
      this.particles.push(flame);
      this.particleContainer.addChild(flame);
    }
  }

  private updateParticles(dt) {
    for(let p of this.particles){
      // console.log(p.life);
      p.life -= dt;
    }
    this.removeDeadParticles();
    for(let p of this.particles){
      p.y += p.v_y * dt;
    }
  }

  public removeDeadParticles() {
    this.particles = this.particles.filter(p => {
      if(p.life <= 0.0) {
        this.particleContainer.removeChild(p);
        return false;
      }
      return true;
    });
    // console.log("In scope particles length: ", particles.length);
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  @ViewChild("canvas") private canvasRef: ElementRef;

  private app: PIXI.Application;
  private particleContainer: PIXI.Container;
  private particles: Array<any>;

  private maxNumParticles: Number = 15000;
  private particleGenerationMaxSpeed: Number = 3000;
  private minParticleLife = 100;
  private maxParticleLife = 200;

  private stats: Stats;
}
