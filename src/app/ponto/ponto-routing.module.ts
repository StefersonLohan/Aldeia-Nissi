import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PontoPage } from './ponto.page';

const routes: Routes = [
  {
    path: '',
    component: PontoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PontoPageRoutingModule {}
