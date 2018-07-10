import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TesterComponent } from './pages/tester/tester.component';
import { ServicesSelectorComponent } from './pages/services-selector/services-selector.component';

const routes: Routes = [
  { path: '', component: TesterComponent },
  { path: 'selector/:portNumber', component: ServicesSelectorComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
