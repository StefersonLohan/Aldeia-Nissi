import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { orderBy, where } from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';

export interface Presenca {
  id?: string;
  assistidoId: string;
  nome: string;
  tipo: string;
  foto?: string;
  data: string; // YYYY-MM-DD
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PresencasService {
  private db = inject(DatabaseService);
  private collectionName = 'presencas';

  /**
   * Mark attendance for a student
   * Business Rule: Only one access per day.
   */
  async marcarPresenca(assistido: any): Promise<{ success: boolean; message?: string }> {
    const today = new Date().toISOString().split('T')[0];
    const id = `${assistido.id}_${today}`;
    
    // Check if check-in already was marked today
    const existing = await firstValueFrom(this.db.getDoc<Presenca>(this.collectionName, id));
    if (existing && existing.timestamp) {
        return { 
          success: false, 
          message: `O assistido ${assistido.nome} já realizou o acesso hoje às ${new Date(existing.timestamp).toLocaleTimeString()}.` 
        };
    }
    
    const presenca: Presenca = {
      assistidoId: assistido.id,
      nome: assistido.nome,
      tipo: assistido.categoria || assistido.tipo,
      foto: assistido.foto || '',
      data: today,
      timestamp: Date.now()
    };

    try {
      await this.db.setDocument(this.collectionName, id, presenca);
      return { success: true };
    } catch (err) {
      console.error('Error saving attendance:', err);
      return { success: false, message: 'Falha ao salvar a presença. Tente novamente.' };
    }
  }

  /**
   * Admin-only: Reset attendance for a student on a specific day
   */
  async resetPresenca(assistidoId: string, date: string): Promise<void> {
    const id = `${assistidoId}_${date}`;
    return this.db.deleteDocument(this.collectionName, id);
  }

  /**
   * Get attendance records for a specific day
   */
  getPresencasDoDia(date: string): Observable<Presenca[]> {
    return this.db.getCollection<Presenca>(
      this.collectionName,
      where('data', '==', date),
      orderBy('timestamp', 'desc')
    );
  }

  /**
   * Check if already marked for today
   */
  getPresencaHoje(assistidoId: string): Observable<Presenca> {
    const today = new Date().toISOString().split('T')[0];
    const id = `${assistidoId}_${today}`;
    return this.db.getDoc<Presenca>(this.collectionName, id);
  }
}
