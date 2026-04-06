import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Assistido } from '../models/assistido.model';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { Observable, from, firstValueFrom, BehaviorSubject } from 'rxjs';
import { collection, query, orderBy, where } from '@angular/fire/firestore';
import { v4 as uuidv4 } from 'uuid';

const PENDING_KEY = 'pending_assistidos';

@Injectable({
  providedIn: 'root'
})
export class AssistidosService {
  private db = inject(DatabaseService);
  private collectionName = 'assistidos';
  
  private syncStatusSubject = new BehaviorSubject<boolean>(false);
  isSyncing$ = this.syncStatusSubject.asObservable();

  constructor() {
    this.initSyncListener();
  }

  // Listen for network changes to auto-sync
  private async initSyncListener() {
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        console.log('Network online. Synchronizing pending registrations...');
        this.syncPending();
      }
    });

    // Initial check
    const status = await Network.getStatus();
    if (status.connected) {
      this.syncPending();
    }
  }

  /**
   * Get all synced assistidos from Firebase
   */
  getSyncedAssistidos(): Observable<Assistido[]> {
    return this.db.getCollection<Assistido>(this.collectionName, orderBy('createdAt', 'desc'));
  }

  /**
   * Save a registration (Offline-First)
   */
  async save(assistido: Assistido): Promise<void> {
    const status = await Network.getStatus();

    if (!assistido.id) {
       assistido.id = uuidv4();
    }

    if (status.connected) {
      try {
        await this.db.setDocument(this.collectionName, assistido.id, { ...assistido, localStatus: 'synced' });
        console.log('Registration saved directly to Firebase');
        return;
      } catch (err) {
        console.error('Failed to save to Firebase, saving locally...', err);
        // Fallback to local if Firebase fails
      }
    }

    // Save locally
    const pending = await this.getLocalPending();
    pending.push({ ...assistido, localStatus: 'pending' });
    await Preferences.set({
      key: PENDING_KEY,
      value: JSON.stringify(pending)
    });
    console.log('Registration saved locally (offline)');
  }

  /**
   * Get all pending (offline) assistidos
   */
  async getLocalPending(): Promise<Assistido[]> {
    const { value } = await Preferences.get({ key: PENDING_KEY });
    return value ? JSON.parse(value) : [];
  }

  /**
   * Update an existing synced assistido
   */
  async update(id: string, assistido: Partial<Assistido>): Promise<void> {
     return this.db.updateDocument(this.collectionName, id, assistido);
  }

  /**
   * Delete an assistido
   */
  async delete(id: string): Promise<void> {
    return this.db.deleteDocument(this.collectionName, id);
  }

  /**
   * Sync all pending items to Firebase
   */
  async syncPending() {
    if (this.syncStatusSubject.value) return; // Already syncing
    
    const pending = await this.getLocalPending();
    if (pending.length === 0) return;

    this.syncStatusSubject.next(true);

    const remaining: Assistido[] = [];
    
    for (const item of pending) {
       try {
         // Create copy without localState
         const { localStatus, ...toUpload } = item;
         if (!toUpload.id) toUpload.id = uuidv4(); // Safeguard
         await this.db.setDocument(this.collectionName, toUpload.id, { ...toUpload, localStatus: 'synced' });
       } catch (e) {
         console.error('Failed to sync item:', item.nome, e);
         remaining.push(item);
       }
    }

    await Preferences.set({
      key: PENDING_KEY,
      value: JSON.stringify(remaining)
    });

    this.syncStatusSubject.next(false);
    console.log(`Sync completed. Remaining: ${remaining.length}`);
  }
}
