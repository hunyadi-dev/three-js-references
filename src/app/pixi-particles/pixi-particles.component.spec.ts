import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PixiParticlesComponent } from './pixi-particles.component';

describe('PixiParticlesComponent', () => {
  let component: PixiParticlesComponent;
  let fixture: ComponentFixture<PixiParticlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PixiParticlesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PixiParticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
