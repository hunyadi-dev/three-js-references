import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { HomeComponent } from './home/home.component';
import { MemoryTestComponent } from './memory-test/memory-test.component';
import { ParticlesTestComponent } from './particles-test/particles-test.component';

const routes: Routes = [
  { path: "", component: HomeComponent }, 
  { path: "memory-test", component: MemoryTestComponent },
  { path: "particles-test", component: ParticlesTestComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
