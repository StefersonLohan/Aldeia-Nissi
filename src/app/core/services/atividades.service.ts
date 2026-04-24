import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { collection, query, orderBy, where } from '@angular/fire/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';

export interface RegistroAtividade {
  id?: string;
  assistidoId: string;
  tipoOcorrencia: string;
  descricao: string;
  envolveTerceiro: boolean;
  nomeTerceiro?: string;
  contatoTerceiro?: string;
  dataOcorrencia: number;
  dataRegistro: number;
  autorId: string;
  autorNome: string;
  localStatus?: 'synced' | 'pending';
}

const PENDING_ATIVIDADES_KEY = 'pending_atividades';

@Injectable({
  providedIn: 'root'
})
export class AtividadesService {
  private db = inject(DatabaseService);
  private collectionName = 'atividades';
  
  private syncStatusSubject = new BehaviorSubject<boolean>(false);
  isSyncing$ = this.syncStatusSubject.asObservable();

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

  getAtividadesByAssistido(assistidoId: string): Observable<RegistroAtividade[]> {
    return this.db.getCollection<RegistroAtividade>(
      this.collectionName, 
      where('assistidoId', '==', assistidoId)
    );
  }

  async save(atividade: RegistroAtividade): Promise<void> {
    const status = await Network.getStatus();

    if (!atividade.id) {
       atividade.id = uuidv4();
    }

    if (status.connected) {
      try {
        await this.db.setDocument(this.collectionName, atividade.id, { ...atividade, localStatus: 'synced' });
        return;
      } catch (err) {
        console.error('Failed to save to Firebase, saving locally...', err);
      }
    }

    const pending = await this.getLocalPending();
    pending.push({ ...atividade, localStatus: 'pending' });
    await Preferences.set({
      key: PENDING_ATIVIDADES_KEY,
      value: JSON.stringify(pending)
    });
  }

  async getLocalPending(): Promise<RegistroAtividade[]> {
    const { value } = await Preferences.get({ key: PENDING_ATIVIDADES_KEY });
    return value ? JSON.parse(value) : [];
  }

  async syncPending() {
    if (this.syncStatusSubject.value) return; 
    
    const pending = await this.getLocalPending();
    if (pending.length === 0) return;

    this.syncStatusSubject.next(true);

    const remaining: RegistroAtividade[] = [];
    
    for (const item of pending) {
       try {
         const { localStatus, ...toUpload } = item;
         if (!toUpload.id) toUpload.id = uuidv4(); 
         await this.db.setDocument(this.collectionName, toUpload.id, { ...toUpload, localStatus: 'synced' });
       } catch (e) {
         remaining.push(item);
       }
    }

    await Preferences.set({
      key: PENDING_ATIVIDADES_KEY,
      value: JSON.stringify(remaining)
    });

    this.syncStatusSubject.next(false);
  }
}
