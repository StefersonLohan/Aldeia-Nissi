import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../core/services/auth.service';
import { AssistidosService } from '../core/services/assistidos.service';
import { Assistido } from '../core/models/assistido.model';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { Dialog } from 'primeng/dialog';
import { QRCodeComponent } from 'angularx-qrcode';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule, 
    CardModule, 
    TagModule, 
    ButtonModule, 
    ChipModule, 
    Dialog,
    QRCodeComponent
  ]
})
export class HomePage implements OnInit, OnDestroy {
  public userName: string = 'Administrador';
  public items: any[] = [];
  public filteredItems: any[] = [];
  public selectedFilter: string = 'Todos';
  
  public showQRDialog: boolean = false;
  public qrCodeData: string = '';
  public selectedAssistidoName: string = '';

  private authSub!: Subscription;
  private syncSub!: Subscription;

  constructor(
     private authService: AuthService, 
     private router: Router,
     private assistidosService: AssistidosService,
     private alertController: AlertController
  ) {}

  ngOnInit() {
    this.authSub = this.authService.user$.subscribe(user => {
      if (user) {
        this.userName = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Usuário';
      }
    });
    this.loadData();
  }

  async loadData() {
    this.assistidosService.getSyncedAssistidos().subscribe(syncedDocs => {
      this.refreshList(syncedDocs);
    });
    this.syncSub = this.assistidosService.isSyncing$.subscribe(() => {
      this.refreshLocalOnly();
    });
  }

  async refreshLocalOnly() {
    this.assistidosService.getSyncedAssistidos().subscribe(syncedDocs => {
       this.refreshList(syncedDocs);
    });
  }

  async refreshList(syncedDocs: Assistido[]) {
    const pending = await this.assistidosService.getLocalPending();
    const all = [...pending, ...syncedDocs].map(a => ({
       id: a.id,
       nome: a.nome,
       tipo: a.categoria,
       subtitle: `${a.categoria} ${a.idade > 0 ? '(' + a.idade + ' anos)' : ''}`,
       aldeia: a.morada || 'Aldeia não inf.',
       foto: a.foto || 'assets/img/avatar_placeholder.png',
       status: a.localStatus === 'pending' ? 'Salvando...' : (a.isAlunoRegular ? 'Regular' : 'Inativo'),
       info_color: a.localStatus === 'pending' ? 'warning' : (a.isAlunoRegular ? 'success' : 'medium'),
       setor: a.localStatus === 'pending' ? 'Offline' : 'Registrado',
       raw: a // Mantemos o objeto bruto para QR e edições
    }));
    this.items = all;
    this.applyFilter(this.selectedFilter);
  }

  applyFilter(filter: string) {
    this.selectedFilter = filter;
    if (filter === 'Todos') {
      this.filteredItems = [...this.items];
    } else {
      const normalizedFilter = filter.replace('s', '').replace('as', 'a'); 
      this.filteredItems = this.items.filter(i => 
        i.tipo.toLowerCase().includes(normalizedFilter.toLowerCase())
      );
    }
  }

  verQRCode(item: any) {
    this.qrCodeData = item.id;
    this.selectedAssistidoName = item.nome;
    this.showQRDialog = true;
  }

  async compartilharQRCode() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      await Share.share({
        title: `QR Code - ${this.selectedAssistidoName}`,
        text: `Identificação de ${this.selectedAssistidoName}`,
        url: dataUrl
      });
    }
  }

  async editAssistido(item: any) {
    this.router.navigate(['/cadastro'], { 
       state: { assistido: item.raw }
    });
  }

  async deleteAssistido(item: any) {
    if (!item.id) return;
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Deseja realmente excluir o cadastro de ${item.nome}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Excluir', role: 'destructive',
          handler: async () => {
             try { await this.assistidosService.delete(item.id); } catch (e) { console.error(e); }
          }
        }
      ]
    });
    await alert.present();
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
    if (this.syncSub) this.syncSub.unsubscribe();
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  }
}
