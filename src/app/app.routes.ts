import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' }, 
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    children: [
      // Cuando entren a /dashboard, por defecto los mandamos a la tabla de usuarios
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' }, 
      { 
        path: 'usuarios', 
        canActivate: [authGuard],
        data: { section: 'USUARIOS' }, // 👈 CANDADO AGREGADO
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent) 
      },
      { 
        path: 'perfiles',
        canActivate: [authGuard],
        data: { section: 'PERFILES' }, // 👈 CANDADO AGREGADO (Módulo de Perfiles)
        loadComponent: () => import('./pages/profiles/profiles.component').then(m => m.ProfilesComponent) 
      },
      { 
        path: 'productos', 
        canActivate: [authGuard],
        data: { section: 'PRODUCTOS' }, // 👈 CANDADO AGREGADO
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent) 
      },     
    ]
  },
  { path: '**', redirectTo: 'login'}
];