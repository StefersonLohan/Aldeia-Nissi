import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PortariaPageRoutingModule } from './portaria-routing.module';

import { PortariaPage } from './portaria.page';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PortariaPageRoutingModule,
    ButtonModule,
    CardModule,
    DialogModule,
    TableModule,
    InputTextModule,
    IconField,
    InputIcon
  ],
  declarations: [PortariaPage]
})
export class PortariaPageModule {}
