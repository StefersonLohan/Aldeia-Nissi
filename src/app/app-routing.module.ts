import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then( m => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'portaria',
    loadComponent: () => import('./portaria/portaria.page').then( m => m.PortariaPage),
    canActivate: [authGuard]
  },
  {
    path: 'social',
    loadComponent: () => import('./social/social.page').then( m => m.SocialPage),
    canActivate: [authGuard]
  },
  {
    path: 'ponto',
    loadChildren: () => import('./ponto/ponto.module').then( m => m.PontoPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./alunos/cadastro/cadastro.page').then( m => m.CadastroPage),
    canActivate: [authGuard]
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./usuarios/usuarios.page').then( m => m.UsuariosPage),
    canActivate: [authGuard]
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
