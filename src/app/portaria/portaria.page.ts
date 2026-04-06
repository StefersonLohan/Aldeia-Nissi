import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { DatabaseService } from '../core/services/database.service';
import { PresencasService, Presenca } from '../core/services/presencas.service';
import { Assistido } from '../core/models/assistido.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';

@Component({
  selector: 'app-portaria',
  templateUrl: './portaria.page.html',
  styleUrls: ['./portaria.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ButtonModule, CardModule, DialogModule, TableModule, InputTextModule, IconFieldModule, InputIconModule, FormsModule]
})
export class PortariaPage implements OnInit {
  private db = inject(DatabaseService);
  private presencasService = inject(PresencasService);
  private authService = inject(AuthService);
  private usuariosService = inject(UsuariosService);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);

  presencasHoje$: Observable<Presenca[]>;
  scannedAssistido: Assistido | null = null;
  showSuccessDialog = false;
  isAdmin = false;

  constructor() {
    const hoje = new Date().toISOString().split('T')[0];
    this.presencasHoje$ = this.presencasService.getPresencasDoDia(hoje);
  }

  ngOnInit() {
    this.checkAdminRole();
  }

  async checkAdminRole() {
    this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of(null);
        return this.db.getDoc<any>('usuarios', user.uid);
      })
    ).subscribe(userData => {
      this.isAdmin = userData?.cargo === 'admin';
    });
  }

  async scanQRCode() {
    if (Capacitor.getPlatform() === 'web') {
      const manualId = window.prompt('Simulador Web: Digite o ID do Assistido (teste)');
      if (manualId) {
        await this.processAttendance(manualId.trim());
      } else {
        this.showError('Cancelado', 'Entrada manual cancelada.');
      }
      return;
    }

    try {
      const granted = await this.requestPermissions();
      if (!granted) {
        this.showError('Permissão Negada', 'Você precisa autorizar o uso da câmera para escanear.');
        return;
      }

      const { barcodes } = await BarcodeScanner.scan();
      
      if (barcodes.length > 0) {
        const studentId = barcodes[0].rawValue;
        if (studentId) {
          await this.processAttendance(studentId);
        }
      }
    } catch (e) {
      console.error('Scan Error:', e);
      this.showError('Erro no Scanner', 'Ocorreu um problema ao abrir a câmera.');
    }
  }

  async processAttendance(id: string) {
    const loading = await this.loadingCtrl.create({ message: 'Verificando...' });
    await loading.present();

    try {
      // Fetch student from Firebase
      const student = await firstValueFrom(this.db.getDoc<Assistido>('assistidos', id));
      
      if (!student || !student.nome) {
        await loading.dismiss();
        this.showError('Não Encontrado', 'Este QR Code não corresponde a nenhum aluno cadastrado.');
        return;
      }

      // Mark attendance
      const result = await this.presencasService.marcarPresenca(student);
      
      await loading.dismiss();

      if (!result.success) {
         this.showError('Acesso Negado', result.message || 'Erro desconhecido.');
         return;
      }

      this.scannedAssistido = student;
      this.showSuccessDialog = true;

    } catch (e) {
      if (loading) await loading.dismiss();
      console.error('Error processing:', e);
      this.showError('Erro no Processo', 'Falha ao buscar dados ou salvar presença.');
    }
  }

  async renovarAcesso(p: Presenca) {
    const alert = await this.alertCtrl.create({
      header: 'Renovar Acesso',
      message: `Deseja realmente permitir que ${p.nome} entre novamente hoje? Isso excluirá o registro anterior.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Liberar Reentrada',
          handler: async () => {
             const loading = await this.loadingCtrl.create({ message: 'Limpando registro...' });
             await loading.present();
             try {
                await this.presencasService.resetPresenca(p.assistidoId, p.data);
                await loading.dismiss();
                // O Observable atualiza a lista automaticamente
             } catch (e) {
                await loading.dismiss();
                this.showError('Erro', 'Falha ao renovar acesso.');
             }
          }
        }
      ]
    });
    await alert.present();
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.checkPermissions();
    if (camera === 'granted') return true;
    
    const { camera: newStatus } = await BarcodeScanner.requestPermissions();
    return newStatus === 'granted';
  }

  async showError(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['Entendi']
    });
    await alert.present();
  }

  fecharSucesso() {
    this.showSuccessDialog = false;
    this.scannedAssistido = null;
  }
}
