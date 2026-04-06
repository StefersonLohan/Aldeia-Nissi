import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PortariaPage } from './portaria.page';

const routes: Routes = [
  {
    path: '',
    component: PortariaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PortariaPageRoutingModule {}
