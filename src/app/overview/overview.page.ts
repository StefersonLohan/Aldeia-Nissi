import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AssistidosService } from '../core/services/assistidos.service';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.page.html',
  styleUrls: ['./overview.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, CardModule, ProgressBarModule]
})
export class OverviewPage implements OnInit, OnDestroy {
  totalAlunos: number = 0;
  totalViuvas: number = 0;
  totalLocais: number = 0;
  totalGeral: number = 0;
  
  percAlunos: number = 0;
  percViuvas: number = 0;

  private syncSub!: Subscription;

  constructor(
    private assistidosService: AssistidosService
  ) {}

  ngOnInit() {
    this.loadData();
    this.syncSub = this.assistidosService.isSyncing$.subscribe(() => {
      this.loadData();
    });
  }

  loadData() {
    this.assistidosService.getSyncedAssistidos().subscribe(async docs => {
       const pending = await this.assistidosService.getLocalPending();
       const all = [...pending, ...docs];
       
       this.totalAlunos = all.filter(a => a.categoria === 'Aluno' || a.categoria === 'Alunos').length;
       this.totalViuvas = all.filter(a => a.categoria === 'Viúva' || a.categoria === 'Viuva' || a.categoria === 'Viúvas').length;
       this.totalGeral = all.length;
       
       if (this.totalGeral > 0) {
         this.percAlunos = Math.round((this.totalAlunos / this.totalGeral) * 100);
         this.percViuvas = Math.round((this.totalViuvas / this.totalGeral) * 100);
       }
       
       const uniqueLocations = new Set(all.map(a => a.morada).filter(m => m && m.trim() !== ''));
       this.totalLocais = uniqueLocations.size || 1; // Default 1 if no moradas filled
    });
  }

  ngOnDestroy() {
    if (this.syncSub) this.syncSub.unsubscribe();
  }
}
