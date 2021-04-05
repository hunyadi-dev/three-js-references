import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { MemoryTestComponent } from './memory-test/memory-test.component';
import { ParticlesTestComponent } from './particles-test/particles-test.component';
import { PixiParticlesComponent } from './pixi-particles/pixi-particles.component';

@NgModule({
  declarations: [
    AppComponent,
    MemoryTestComponent,
    HomeComponent,
    ParticlesTestComponent,
    PixiParticlesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
