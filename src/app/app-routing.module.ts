import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TesterComponent } from './pages/tester/tester.component';

const routes: Routes = [
  { path: '', component: TesterComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
