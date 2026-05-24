import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatListModule, MatIconModule, MatButtonModule
  ],
  template: `
    @if (auth.isAuthenticated()) {
      <mat-sidenav-container class="app-container">
        <mat-sidenav mode="side" opened class="sidenav">

          <!-- Logo -->
          <div class="brand">
            <mat-icon class="brand-icon">security</mat-icon>
            <span>FinShield</span>
          </div>

          <!-- Navigation Links -->
          <mat-nav-list>
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            <a mat-list-item routerLink="/transactions" routerLinkActive="active">
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span matListItemTitle>Transactions</span>
            </a>
            <a mat-list-item routerLink="/fraud" routerLinkActive="active">
              <mat-icon matListItemIcon>gpp_bad</mat-icon>
              <span matListItemTitle>Fraud Alerts</span>
            </a>
            <a mat-list-item routerLink="/insights" routerLinkActive="active">
              <mat-icon matListItemIcon>auto_awesome</mat-icon>
              <span matListItemTitle>AI Insights</span>
            </a>

            <!-- Only show Admin link if user has Admin role -->
            @if (auth.isAdmin()) {
              <mat-divider></mat-divider>
              <a mat-list-item routerLink="/admin" routerLinkActive="active">
                <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
                <span matListItemTitle>Admin</span>
              </a>
            }
          </mat-nav-list>

          <!-- User info and logout at the bottom -->
          <div class="sidenav-footer">
            <div class="user-info">
              <mat-icon>account_circle</mat-icon>
              <span>{{ auth.currentUser()?.firstName }}</span>
            </div>
            <button mat-icon-button (click)="auth.logout()" title="Logout">
              <mat-icon>logout</mat-icon>
            </button>
          </div>

        </mat-sidenav>
        <mat-sidenav-content class="main-content">
          <router-outlet />
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <!-- No sidenav for auth pages -->
      <router-outlet />
    }
  `,
  styles: [`
    .app-container { height: 100vh; }

    .sidenav {
      width: 240px;
      background: #0d1b2a;
      color: white;
      display: flex;
      flex-direction: column;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      font-size: 20px;
      font-weight: 700;
      color: #4fc3f7;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .brand-icon { font-size: 28px; }

    mat-nav-list { flex: 1; }

    mat-nav-list a {
      color: rgba(255,255,255,0.7) !important;
      border-radius: 8px;
      margin: 2px 8px;
    }

    mat-nav-list a.active {
      background: rgba(79,195,247,0.15) !important;
      color: #4fc3f7 !important;
    }

    mat-nav-list a mat-icon { color: inherit; }

    .sidenav-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: rgba(255,255,255,0.7);
    }

    .user-info mat-icon { font-size: 20px; }

    .main-content {
      background: #f5f7fa;
      overflow-y: auto;
    }

    mat-divider {
      border-color: rgba(255,255,255,0.1) !important;
      margin: 8px 0;
    }
  `]
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}