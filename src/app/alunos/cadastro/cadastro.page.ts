import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { QRCodeComponent } from 'angularx-qrcode';
import { Dialog } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';

import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Share } from '@capacitor/share';
import { v4 as uuidv4 } from 'uuid';

import { AssistidosService } from 'src/app/core/services/assistidos.service';
import { Assistido } from 'src/app/core/models/assistido.model';
import { AtividadesService, RegistroAtividade } from 'src/app/core/services/atividades.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    CheckboxModule,
    ButtonModule,
    CardModule,
    FloatLabelModule,
    QRCodeComponent,
    Dialog,
    ImageModule,
  ],
})
export class CadastroPage implements OnInit {
  categorias = [
    { label: 'Criança (Aluno comum)', value: 'aluno' },
    { label: 'Criança Albina', value: 'albina' },
    { label: 'Viúva', value: 'viuva' },
  ];

  selectedCategoria: any;
  nome: string = '';
  idade: number | any = null;
  morada: string = '';
  isAlunoRegular: boolean = false;
  hasAulasExtras: boolean = false;
  observacoes: string = '';
  foto: string = '';
  gps_lat?: number;
  gps_lng?: number;
  editingId?: string;

  showQRCode: boolean = false;
  qrCodeData: string = '';

  currentSegment: string = 'dados';
  
  // Atividades
  atividades: RegistroAtividade[] = [];
  showNovaAtividade: boolean = false;
  novaAtividade: Partial<RegistroAtividade> = {
    tipoOcorrencia: 'Ocorrência interna - Escola',
    envolveTerceiro: false,
    descricao: ''
  };
  opcoesAtividade = [
    { label: 'Ocorrência interna - Escola', value: 'Ocorrência interna - Escola' },
    { label: 'Ocorrência interna - Moradia', value: 'Ocorrência interna - Moradia' },
    { label: 'Ocorrência externa - Família', value: 'Ocorrência externa - Família' },
    { label: 'Ocorrência externa - Hospital', value: 'Ocorrência externa - Hospital' },
    { label: 'Boletim de Ocorrência', value: 'Boletim de Ocorrência' },
    { label: 'Outro', value: 'Outro' },
  ];
  dataOcorrenciaInput: string = new Date().toISOString().split('T')[0];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private assistidosService: AssistidosService,
    private atividadesService: AtividadesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state && (state as any).assistido) {
      const a = (state as any).assistido;
      this.editingId = a.id;
      this.nome = a.nome;
      this.idade = a.idade;
      this.selectedCategoria =
        this.categorias.find((c) => c.label === (a.categoria || a.tipo)) ||
        this.categorias[0];
      this.morada = a.morada || a.aldeia;
      this.foto = a.foto;
      this.isAlunoRegular = a.isAlunoRegular || a.status === 'Regular';
      this.hasAulasExtras = a.hasAulasExtras || false;
      this.observacoes = a.observacoes || '';
      
      this.carregarAtividades();
    }
  }

  carregarAtividades() {
    if (!this.editingId) return;
    this.atividadesService.getAtividadesByAssistido(this.editingId).subscribe(data => {
      this.atividades = data.sort((a, b) => b.dataOcorrencia - a.dataOcorrencia);
    });
  }

  async salvarAtividade() {
    if (!this.editingId) {
      const alert = await this.alertController.create({ header: 'Atenção', message: 'Salve o cadastro do assistido antes de adicionar atividades.', buttons: ['OK']});
      await alert.present();
      return;
    }
    if (!this.novaAtividade.descricao) {
      const alert = await this.alertController.create({ header: 'Atenção', message: 'Descreva a atividade.', buttons: ['OK']});
      await alert.present();
      return;
    }

    const user = this.authService.getCurrentUser();
    // Converter 'YYYY-MM-DD' em número (timestamp)
    let dataOc = Date.now();
    if (this.dataOcorrenciaInput) {
       const [year, month, day] = this.dataOcorrenciaInput.split('-');
       dataOc = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0).getTime();
    }

    const atividade: RegistroAtividade = {
      assistidoId: this.editingId,
      tipoOcorrencia: this.novaAtividade.tipoOcorrencia || 'Outro',
      descricao: this.novaAtividade.descricao,
      envolveTerceiro: !!this.novaAtividade.envolveTerceiro,
      nomeTerceiro: this.novaAtividade.nomeTerceiro,
      contatoTerceiro: this.novaAtividade.contatoTerceiro,
      dataOcorrencia: dataOc,
      dataRegistro: Date.now(),
      autorId: user?.uid || 'offline',
      autorNome: user?.displayName || 'Anônimo'
    };

    try {
      await this.atividadesService.save(atividade);
      this.showNovaAtividade = false;
      this.novaAtividade = { tipoOcorrencia: 'Ocorrência interna - Escola', envolveTerceiro: false, descricao: '' };
      this.dataOcorrenciaInput = new Date().toISOString().split('T')[0];
      
      // A atualização da lista local offline
      const pending = await this.atividadesService.getLocalPending();
      const offlineActs = pending.filter(a => a.assistidoId === this.editingId);
      if (offlineActs.length > 0) {
          // Só atualizamos visualmente com o q ta offline se precisar, mas getAtividadesByAssistido vai demorar a dar refresh offline.
          // O Firebase tenta atualizar se online. Por garantia, damos reload.
          this.carregarAtividades();
      }

      const alert = await this.alertController.create({ header: 'Sucesso', message: 'Atividade registrada!', buttons: ['OK']});
      await alert.present();
    } catch(e) {
      console.error(e);
    }
  }

  async tirarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 40,
        width: 400,
        height: 400,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
      });
      if (image.base64String) {
        const rawPhoto = `data:image/${image.format};base64,${image.base64String}`;
        this.foto = await this.resizeImage(rawPhoto, 300, 300);
      }
    } catch (e) {
      console.error('Camera failed', e);
    }
  }

  async resizeImage(
    base64: string,
    maxWidth: number,
    maxHeight: number,
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  }

  async capturarGPS() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      this.gps_lat = coordinates.coords.latitude;
      this.gps_lng = coordinates.coords.longitude;
      const alert = await this.alertController.create({
        header: 'Localização Capturada',
        message: `Coordenadas: ${this.gps_lat.toFixed(4)}, ${this.gps_lng.toFixed(4)}`,
        buttons: ['OK'],
      });
      await alert.present();
    } catch (e) {
      this.alertController
        .create({
          header: 'Erro no GPS',
          message: 'Verifique permissões.',
          buttons: ['OK'],
        })
        .then((a) => a.present());
    }
  }

  async salvarCadastro() {
    if (!this.nome || !this.selectedCategoria) {
      const alert = await this.alertController.create({
        header: 'Campos Obrigatórios',
        message: 'Informe Nome e Categoria.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const studentId = this.editingId || uuidv4();
    const novoAssistido: Assistido = {
      id: studentId,
      nome: this.nome,
      idade: this.idade || 0,
      categoria: this.selectedCategoria.label,
      morada: this.morada,
      isAlunoRegular: this.isAlunoRegular,
      hasAulasExtras: this.hasAulasExtras,
      observacoes: this.observacoes,
      foto: this.foto,
      gps: this.gps_lat ? { lat: this.gps_lat, lng: this.gps_lng! } : undefined,
      createdAt: Date.now(),
    };

    try {
      if (this.editingId) {
        await this.assistidosService.update(this.editingId, novoAssistido);
      } else {
        await this.assistidosService.save(novoAssistido);
      }
      this.qrCodeData = studentId;
      this.showQRCode = true;
    } catch (err) {
      console.error('Failed to save', err);
    }
  }

  async compartilharQRCode() {
    // Pegamos o canvas gerado pelo angularx-qrcode
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      await Share.share({
        title: `QR Code - ${this.nome}`,
        text: `QR Code de identificação para ${this.nome}`,
        url: dataUrl,
        dialogTitle: 'Compartilhar QR Code',
      });
    }
  }

  fecharEVoltar() {
    this.showQRCode = false;
    this.router.navigate(['/home']);
  }
}
