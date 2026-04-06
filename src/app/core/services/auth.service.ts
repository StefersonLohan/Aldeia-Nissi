import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  authState, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User,
  getAuth,
  updateProfile
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  user$: Observable<User | null> = authState(this.auth);

  async register({ email, password, name }: any) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    if (credential.user) {
      await updateProfile(credential.user, { displayName: name });
    }
    return credential;
  }

  login({ email, password }: any) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}
