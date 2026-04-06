import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PontoPageRoutingModule } from './ponto-routing.module';

import { PontoPage } from './ponto.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PontoPageRoutingModule
  ],
  declarations: [PontoPage]
})
export class PontoPageModule {}
