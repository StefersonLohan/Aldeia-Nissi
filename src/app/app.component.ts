import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private router: Router) {}

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
