import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/guards';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent)
  },
  {
    path: 'fraud',
    canActivate: [authGuard],
    loadComponent: () => import('./features/fraud/fraud.component').then(m => m.FraudComponent)
  },
  {
    path: 'insights',
    canActivate: [authGuard],
    loadComponent: () => import('./features/insights/insights.component').then(m => m.InsightsComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];