import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  QueryConstraint
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private firestore: Firestore = inject(Firestore);

  // Get a collection with data
  getCollection<T>(path: string, ...queryConstraints: QueryConstraint[]): Observable<T[]> {
    const colRef = collection(this.firestore, path);
    const q = query(colRef, ...queryConstraints);
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  // Get a single document
  getDoc<T>(path: string, id: string): Observable<T> {
    const docRef = doc(this.firestore, path, id);
    return docData(docRef, { idField: 'id' }) as Observable<T>;
  }

  // Create a new document with auto ID
  addDocument<T>(path: string, data: any): Promise<any> {
    const colRef = collection(this.firestore, path);
    return addDoc(colRef, data);
  }

  // Set a document with specific ID (creates or overwrites)
  setDocument(path: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, path, id);
    return setDoc(docRef, data);
  }

  // Update a document
  updateDocument(path: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, path, id);
    return updateDoc(docRef, data);
  }

  // Delete a document
  deleteDocument(path: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, path, id);
    return deleteDoc(docRef);
  }
}
