import { Component, OnInit, OnDestroy, AfterViewInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, Platform } from '@ionic/angular';
import { DatabaseService } from '../core/services/database.service';
import { AssistidosService } from '../core/services/assistidos.service';
import { VisitasService, VisitaCampo } from '../core/services/visitas.service';
import { AuthService } from '../core/services/auth.service';
import { Assistido } from '../core/models/assistido.model';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Subscription } from 'rxjs';

// PrimeNG Components (v20 Standalone)
import { AutoComplete } from 'primeng/autocomplete';
import { Checkbox } from 'primeng/checkbox';
import { Textarea } from 'primeng/textarea';
import { Button } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { ToggleButton } from 'primeng/togglebutton';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Tag } from 'primeng/tag';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

// Capacitor
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  styleUrls: ['./social.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule, 
    AutoComplete, 
    Checkbox, 
    Textarea, 
    Button,
    FloatLabel,
    Select,
    InputNumber,
    InputText,
    ToggleButton,
    TableModule,
    SelectButtonModule,
    Tag,
    IconField,
    InputIcon
  ]
})
export class SocialPage implements OnInit, OnDestroy, AfterViewInit {
  private db = inject(DatabaseService);
  private assistidosService = inject(AssistidosService);
  private visitasService = inject(VisitasService);
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private router = inject(Router);
  private platform = inject(Platform);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  // --- View State ---
  viewMode: 'map' | 'list' | 'form' = 'map';
  isPickingLocation: boolean = false;
  viewOptions = [
    { label: 'Mapa', value: 'map', icon: 'pi pi-map' },
    { label: 'Lista', value: 'list', icon: 'pi pi-list' },
    { label: 'Form', value: 'form', icon: 'pi pi-file-edit' }
  ];
  
  // --- Map Properties ---
  private map?: L.Map;
  private markers: L.Marker[] = [];
  private visitasSub?: Subscription;
  private currentSelectionMarker?: L.Marker;
  private routingControl?: any;
  
  // --- Data state ---
  allVisitas: VisitaCampo[] = [];
  editingVisitaId: string | null = null;

  // --- Form State ---
  isAssistido: boolean = true;
  selectedAssistido: any;
  interviewedName: string = '';
  filteredAssistidos: any[] = [];
  allAssistidos: Assistido[] = [];
  
  // Basic Info
  areaAssistencia: string = '';
  motivoVisita: string = '';
  
  quemRecebeu: string = '';
  opcoesParentesco = [
    { label: 'Pai', value: 'Pai' },
    { label: 'Mãe', value: 'Mãe' },
    { label: 'Avó', value: 'Avó' },
    { label: 'Avô', value: 'Avô' },
    { label: 'Filho(a)', value: 'Filho/Filha' },
    { label: 'Tio(a)', value: 'Tio/Tia' },
    { label: 'Outro', value: 'Outro' }
  ];

  totalMoradores: number = 1;
  tipoCasa: string = '';
  opcoesCasa = [
    { label: 'Madeira', value: 'Madeira' },
    { label: 'Chapa (Zinco)', value: 'Chapa' },
    { label: 'Barro', value: 'Barro' },
    { label: 'Alvenaria', value: 'Alvenaria' }
  ];

  principaisQueixas: string = '';
  detalhesSaude: string = '';

  // Spiritual
  espiritual = {
    segueReligiao: false,
    qualReligiao: '',
    conheceJesus: false,
    entregouVida: false,
    temInteresse: false,
    possuiBiblia: false
  };

  // Volunteer Observation
  percepcoesGerais: string = '';
  acoesConsideradas: string = '';
  pontoSensivel: string = '';

  // Multi-purpose / Legacy
  situacao = {
    apoioMedico: false,
    apoioEspiritual: false,
    cestaBasica: false
  };
  detalhes: string = '';
  fotos: string[] = [];
  gps?: { lat: number; lng: number };

  constructor() { 
    // Tornar funções de edição e navegação acessíveis pelo Leaflet
    (window as any).socialPageEditVisit = (id: string) => {
      this.zone.run(() => {
        const visita = this.allVisitas.find(v => v.id === id);
        if (visita) this.carregarVisitaParaEdicao(visita);
      });
    };

    (window as any).socialPageTraceRoute = (id: string) => {
      this.zone.run(() => {
        const visita = this.allVisitas.find(v => v.id === id);
        if (visita) this.tracarRota(visita);
      });
    };

    (window as any).socialPageExternalMap = (lat: number, lng: number) => {
      this.zone.run(() => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
      });
    };
  }

  ngOnInit() {
    this.loadAssistidos();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 500);
  }

  ngOnDestroy() {
    if (this.visitasSub) this.visitasSub.unsubscribe();
    if (this.map) {
      if (this.routingControl) {
        this.routingControl.remove();
      }
      this.map.remove();
      this.map = undefined;
    }
    (window as any).socialPageEditVisit = null;
    (window as any).socialPageTraceRoute = null;
    (window as any).socialPageExternalMap = null;
  }

  private initMap() {
    if (this.map) return;
    const defaultLat = -12.3833;
    const defaultLng = 16.9333;

    this.map = L.map('map-container', {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
    this.loadVisitasOnMap();
    this.locateMe(false);
  }

  private loadVisitasOnMap() {
    if (this.visitasSub) this.visitasSub.unsubscribe();

    this.visitasSub = this.visitasService.getVisitas().subscribe(visitas => {
      this.allVisitas = visitas;
      this.markers.forEach(m => m.remove());
      this.markers = [];

      visitas.forEach(v => {
        if (v.gps) {
          const marker = L.marker([v.gps.lat, v.gps.lng], {
            icon: L.divIcon({
              className: 'custom-pin',
              html: `
                <div style="background-color: var(--ion-color-primary, #e65100); width: 20px; height: 20px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                   <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 24]
            })
          }).addTo(this.map!);
          
          const statusTxt = v.localStatus === 'pending' ? '<span style="color:red; font-weight:700">Aguardando Wi-Fi</span>' : '<span style="color:green; font-weight:700">Sincronizado</span>';
          
          const popupContent = `
            <div style="font-family: inherit; padding: 5px; min-width: 180px;">
              <strong style="color:var(--ion-color-primary); font-size: 15px;">${v.assistidoNome}</strong><br>
              <div style="margin-top: 5px; font-size: 11px; opacity: 0.8;">
                📅 <strong>${new Date(v.data).toLocaleDateString()}</strong><br>
                📡 ${statusTxt}
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
                <button 
                  style="width: 100%; background: var(--ion-color-secondary, #3880ff); color: white; border: none; padding: 8px; border-radius: 6px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;"
                  onclick="window.socialPageExternalMap(${v.gps.lat}, ${v.gps.lng})">
                  <i class="pi pi-directions"></i> COMO CHEGAR
                </button>
                <button 
                  style="width: 100%; background: #2dd36f; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;"
                  onclick="window.socialPageTraceRoute('${v.id}')">
                  <i class="pi pi-map"></i> TRAÇAR NO MAPA
                </button>
                <button 
                  style="width: 100%; background: #f4f5f8; color: #333; border: 1px solid #ddd; padding: 6px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 10px;"
                  onclick="window.socialPageEditVisit('${v.id}')">
                  EDITAR DADOS
                </button>
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent);
          this.markers.push(marker);
        }
      });
    });
  }

  carregarVisitaParaEdicao(visita: VisitaCampo) {
    this.editingVisitaId = visita.id || null;
    this.isAssistido = visita.isAssistido;
    
    if (visita.isAssistido) {
      this.selectedAssistido = this.allAssistidos.find(a => a.id === visita.assistidoId);
    } else {
      this.interviewedName = visita.assistidoNome;
    }

    this.areaAssistencia = visita.areaAssistencia || '';
    this.motivoVisita = visita.motivoVisita || '';
    this.quemRecebeu = visita.quemRecebeu || '';
    this.totalMoradores = visita.totalMoradores || 1;
    this.tipoCasa = visita.tipoCasa || '';
    this.principaisQueixas = visita.principaisQueixas || '';
    this.detalhesSaude = visita.detalhesSaude || '';
    this.espiritual = { 
      ...visita.espiritual,
      qualReligiao: visita.espiritual.qualReligiao || '' 
    };
    this.percepcoesGerais = visita.percepcoesGerais || '';
    this.acoesConsideradas = visita.acoesConsideradas || '';
    this.pontoSensivel = visita.pontoSensivel || '';
    this.situacao = { ...visita.situacao };
    this.detalhes = visita.detalhes || '';
    this.fotos = [...(visita.fotos || [])];
    this.gps = visita.gps;

    this.viewMode = 'form';
    this.cdr.detectChanges();
  }

  focusNoMapa(visita: VisitaCampo) {
    if (!visita.gps) return;
    this.viewMode = 'map';
    this.cdr.detectChanges();
    
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.map.setView([visita.gps!.lat, visita.gps!.lng], 16);
        
        const marker = this.markers.find(m => {
          const pos = m.getLatLng();
          return Math.abs(pos.lat - visita.gps!.lat) < 0.0001 && Math.abs(pos.lng - visita.gps!.lng) < 0.0001;
        });
        if (marker) marker.openPopup();
      }
    }, 400);
  }

  async tracarRota(visita: VisitaCampo) {
    if (!this.map || !visita.gps) return;

    try {
      const pos = await Geolocation.getCurrentPosition();
      const start = L.latLng(pos.coords.latitude, pos.coords.longitude);
      const end = L.latLng(visita.gps.lat, visita.gps.lng);

      if (this.routingControl) {
        this.routingControl.remove();
      }

      this.routingControl = (L as any).Routing.control({
        waypoints: [start, end],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        lineOptions: {
          styles: [{ color: 'var(--ion-color-primary, #e65100)', weight: 6, opacity: 0.8 }]
        },
        createMarker: () => null // Não criar novos marcadores, já temos os nossos
      }).addTo(this.map);

      this.map.closePopup();
      this.showAlert('Rota Gerada', 'O trajeto foi traçado no mapa saindo da sua localização atual.');
    } catch (e) {
      this.showAlert('Erro', 'Certifique-se que o GPS está ativo para traçar a rota.');
    }
  }

  toggleView() {
    if (this.viewMode === 'map') {
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 300);
    }
  }

  async locateMe(showAlert = true) {
    try {
      const pos = await Geolocation.getCurrentPosition();
      if (this.map) {
        this.map.setView([pos.coords.latitude, pos.coords.longitude], 16);
      }
    } catch (e) {
      if (showAlert) this.showAlert('Erro', 'Não foi possível obter sua localização atual.');
    }
  }

  onMapClick(e: L.LeafletMouseEvent) {
    if (this.isPickingLocation) {
      this.zone.run(() => {
        this.gps = { lat: e.latlng.lat, lng: e.latlng.lng };
        
        if (this.currentSelectionMarker) this.currentSelectionMarker.remove();
        this.currentSelectionMarker = L.marker([e.latlng.lat, e.latlng.lng], {
          icon: L.divIcon({
            className: 'pick-pin',
            html: `
              <div style="background-color: var(--ion-color-warning, #ffc409); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px dashed white; box-shadow: 0 0 15px rgba(255,196,9,0.5); animation: pulse-pick 1.5s infinite;">
                 <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(this.map!);

        this.confirmManualLocation();
      });
    }
  }

  async confirmManualLocation() {
    const alert = await this.alertCtrl.create({
      header: 'Local Selecionado',
      message: 'Deseja iniciar o cadastro para este ponto no mapa?',
      buttons: [
        { text: 'Não', role: 'cancel' },
        { text: 'Sim', handler: () => {
          this.isPickingLocation = false;
          this.viewMode = 'form';
        }}
      ]
    });
    await alert.present();
  }

  startNewVisit(manual = false) {
    if (manual) {
      this.isPickingLocation = true;
      this.showAlert('Seleção Manual', 'Toque no mapa para marcar o local da visita.');
    } else {
      this.capturarGPS();
    }
  }

  loadAssistidos() {
    this.assistidosService.getSyncedAssistidos().subscribe(data => {
      this.allAssistidos = data;
    });
  }

  filterAssistidos(event: any) {
    const query = event.query.toLowerCase();
    this.filteredAssistidos = this.allAssistidos.filter(a => 
      a.nome.toLowerCase().includes(query) || 
      a.id?.toLowerCase().includes(query)
    );
  }

  async tirarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 50, width: 600, height: 600,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      if (image.base64String) {
        this.fotos.push(`data:image/${image.format};base64,${image.base64String}`);
      }
    } catch (e) {
      console.error('Camera failed', e);
    }
  }

  async capturarGPS() {
    const loading = await this.loadingCtrl.create({ message: 'Obtendo GPS...' });
    await loading.present();
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      this.gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      await loading.dismiss();
      this.viewMode = 'form';
      this.showAlert('Sucesso', 'Localização capturada com sucesso.');
    } catch (e) {
      await loading.dismiss();
      this.showAlert('Erro', 'Verifique o GPS e as permissões.');
    }
  }

  async salvarRelatorio() {
    if (this.isAssistido && !this.selectedAssistido) {
      this.showAlert('Atenção', 'Selecione um Assistido.');
      return;
    }
    if (!this.isAssistido && !this.interviewedName) {
      this.showAlert('Atenção', 'Informe o nome da pessoa entrevistada.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Salvando...' });
    await loading.present();

    try {
      const user = this.authService.getCurrentUser();
      const visita: VisitaCampo = {
        id: this.editingVisitaId || undefined,
        assistidoId: this.isAssistido ? this.selectedAssistido?.id : undefined,
        assistidoNome: this.isAssistido ? this.selectedAssistido?.nome : this.interviewedName,
        isAssistido: this.isAssistido,
        areaAssistencia: this.areaAssistencia,
        motivoVisita: this.motivoVisita,
        data: Date.now(),
        quemRecebeu: this.quemRecebeu,
        totalMoradores: this.totalMoradores,
        tipoCasa: this.tipoCasa,
        principaisQueixas: this.principaisQueixas,
        detalhesSaude: this.detalhesSaude,
        espiritual: { 
          ...this.espiritual,
          qualReligiao: this.espiritual.qualReligiao || '' 
        },
        percepcoesGerais: this.percepcoesGerais,
        acoesConsideradas: this.acoesConsideradas,
        pontoSensivel: this.pontoSensivel,
        situacao: { ...this.situacao },
        detalhes: this.detalhes,
        gps: this.gps,
        fotos: this.fotos,
        usuarioId: user?.uid || 'offline',
        usuarioNome: user?.displayName || 'Anônimo'
      };

      await this.visitasService.save(visita);
      await loading.dismiss();
      this.showAlert('Sucesso', 'Relatório salvo com sucesso.');
      this.limparFormulario();
      this.viewMode = 'map';
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 300);
    } catch (e) {
      await loading.dismiss();
      this.showAlert('Erro', 'Não foi possível salvar.');
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  limparFormulario() {
    this.editingVisitaId = null;
    this.isAssistido = true;
    this.selectedAssistido = null;
    this.interviewedName = '';
    this.areaAssistencia = '';
    this.motivoVisita = '';
    this.quemRecebeu = '';
    this.totalMoradores = 1;
    this.tipoCasa = '';
    this.principaisQueixas = '';
    this.detalhesSaude = '';
    this.espiritual = { segueReligiao: false, qualReligiao: '', conheceJesus: false, entregouVida: false, temInteresse: false, possuiBiblia: false };
    this.percepcoesGerais = '';
    this.acoesConsideradas = '';
    this.pontoSensivel = '';
    this.detalhes = '';
    this.situacao = { apoioMedico: false, apoioEspiritual: false, cestaBasica: false };
    this.fotos = [];
    this.gps = undefined;
    if (this.currentSelectionMarker) {
      this.currentSelectionMarker.remove();
      this.currentSelectionMarker = undefined;
    }
  }
}
