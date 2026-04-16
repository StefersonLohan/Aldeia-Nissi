import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { DatabaseService } from './core/services/database.service';
import { Subscription } from 'rxjs';
import { Usuario } from './usuarios/usuarios.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  private authSub!: Subscription;

  constructor(
     private router: Router,
     private authService: AuthService,
     private db: DatabaseService
  ) {}

  ngOnInit() {
    this.authSub = this.authService.user$.subscribe(async user => {
      if (user) {
         try {
           const dbUser = await this.db.getDocument<Usuario>('usuarios', user.uid);
           if (dbUser && dbUser.cargo === 'admin') {
             this.isAdmin = true;
           } else {
             this.isAdmin = false;
           }
         } catch(e) {
           this.isAdmin = false;
         }
      } else {
         this.isAdmin = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  showLayout(): boolean {
    return !this.router.url.includes('/login');
  }

  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }
}
