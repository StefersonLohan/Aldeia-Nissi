import { Injectable, inject } from '@angular/core';
import { Usuario } from './usuarios.model';
import { Observable, from, map } from 'rxjs';
import { DatabaseService } from '../core/services/database.service';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private db: DatabaseService = inject(DatabaseService);
  private auth: AuthService = inject(AuthService);
  private COLLECTION = 'usuarios';

  getUsuarios(): Observable<Usuario[]> {
    return this.db.getCollection<Usuario>(this.COLLECTION);
  }

  saveUsuario(usuario: Usuario): Observable<void> {
    if (!usuario.id) {
      // New user: Create in Firebase Auth first, then record in Firestore
      return from(this.registerAndSave(usuario)).pipe(map(() => undefined));
    } else {
      // Update existing user in Firestore
      const { senha, ...updateData } = usuario;
      return from(this.db.updateDocument(this.COLLECTION, usuario.id, updateData));
    }
  }

  private async registerAndSave(usuario: Usuario): Promise<void> {
    try {
      // 1. Create in Firebase Auth
      const credential = await this.auth.register({
        email: usuario.email,
        password: usuario.senha!,
        name: usuario.nome
      });

      // 2. Save metadata in Firestore using the Auth UID
      const newUser: Usuario = {
        ...usuario,
        id: credential.user.uid,
        createdAt: new Date().toISOString()
      };
      delete newUser.senha; // Don't store password in Firestore

      await this.db.setDocument(this.COLLECTION, newUser.id!, newUser);
    } catch (error) {
      console.error('Erro ao registrar usuário no Firebase:', error);
      throw error;
    }
  }

  deleteUsuario(id: string): Observable<void> {
    // Note: This only deletes from Firestore. 
    // Deleting from Auth requires Admin SDK or being logged in as the user.
    return from(this.db.deleteDocument(this.COLLECTION, id));
  }
}
