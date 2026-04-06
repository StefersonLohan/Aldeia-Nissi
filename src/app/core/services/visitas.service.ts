import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { v4 as uuidv4 } from 'uuid';
import { Observable, combineLatest, from, map, of, switchMap } from 'rxjs';

export interface VisitaCampo {
  id?: string;
  assistidoId?: string; // Optional if not already assisted
  assistidoNome: string; // If not assisted, this will be the name of the interviewed person
  isAssistido: boolean;
  areaAssistencia?: string; // If isAssistido=true
  motivoVisita?: string;    // If isAssistido=false
  data: number;
  
  // Dados Básicos da Casa
  quemRecebeu: string; // Pai, mãe, avó, avô, filho, filha, tio
  totalMoradores: number;
  tipoCasa: string; // Madeira, chapa, barro, alvenaria
  principaisQueixas: string;
  detalhesSaude: string;

  // Espiritual
  espiritual: {
    segueReligiao: boolean;
    qualReligiao?: string;
    conheceJesus: boolean;
    entregouVida: boolean;
    temInteresse: boolean; // if entregouVida=false
    possuiBiblia: boolean;
  };

  // Observação do Voluntário
  percepcoesGerais: string;
  acoesConsideradas: string;
  pontoSensivel?: string; // Moléstia, saúde, etc.

  situacao: {
    apoioMedico: boolean;
    apoioEspiritual: boolean;
    cestaBasica: boolean;
  };
  detalhes: string; // Campo livre anterior mantido para retrocompatibilidade ou notas extras
  gps?: {
    lat: number;
    lng: number;
  };
  fotos?: string[];
  usuarioId: string;
  usuarioNome: string;
  localStatus?: 'pending' | 'synced';
}

const PENDING_VISITAS_KEY = 'pending_visitas_campo';

@Injectable({
  providedIn: 'root'
})
export class VisitasService {
  private db = inject(DatabaseService);
  private collectionName = 'visitas_campo';

  constructor() {
    this.initSyncListener();
  }

  private async initSyncListener() {
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        this.syncPending();
      }
    });
    
    const status = await Network.getStatus();
    if (status.connected) {
      this.syncPending();
    }
  }

  async save(visita: VisitaCampo): Promise<void> {
    if (!visita.id) visita.id = uuidv4();
    const status = await Network.getStatus();

    if (status.connected) {
      try {
        await this.db.setDocument(this.collectionName, visita.id, { ...visita, localStatus: 'synced' });
        return;
      } catch (err) {
        console.error('Firebase save failed, saving locally', err);
      }
    }

    const pending = await this.getLocalPending();
    pending.push({ ...visita, localStatus: 'pending' });
    await Preferences.set({
      key: PENDING_VISITAS_KEY,
      value: JSON.stringify(pending)
    });
  }

  async getLocalPending(): Promise<VisitaCampo[]> {
    const { value } = await Preferences.get({ key: PENDING_VISITAS_KEY });
    return value ? JSON.parse(value) : [];
  }

  async sync(): Promise<void> {
    await this.syncPending();
  }

  private async syncPending() {
    const pending = await this.getLocalPending();
    if (pending.length === 0) return;

    const remaining: VisitaCampo[] = [];
    for (const item of pending) {
      try {
        const { localStatus, ...toUpload } = item;
        await this.db.setDocument(this.collectionName, toUpload.id!, { ...toUpload, localStatus: 'synced' });
      } catch (e) {
        remaining.push(item);
      }
    }

    await Preferences.set({
      key: PENDING_VISITAS_KEY,
      value: JSON.stringify(remaining)
    });
  }

  getVisitas(): Observable<VisitaCampo[]> {
    const remote$ = this.db.getCollection<VisitaCampo>(this.collectionName);
    const local$ = from(this.getLocalPending());

    return remote$.pipe(
      switchMap(remoteVisitas => 
        local$.pipe(
          map(localVisitas => {
            // Combine both, but avoid duplicates if a local sync just happened
            const combined = [...localVisitas];
            remoteVisitas.forEach(rv => {
              if (!combined.find(lv => lv.id === rv.id)) {
                combined.push(rv);
              }
            });
            return combined;
          })
        )
      )
    );
  }
}
