import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe,
    MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatTabsModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Admin Panel</h1>
        <p class="subtitle">System overview and management</p>
      </div>

      @if (summary()) {
        <div class="stat-grid">
          <mat-card class="stat-card">
            <mat-icon class="stat-icon">people</mat-icon>
            <div class="stat-label">Total Users</div>
            <div class="stat-value">{{ summary()!.totalUsers }}</div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon class="stat-icon">receipt_long</mat-icon>
            <div class="stat-label">Total Transactions</div>
            <div class="stat-value">{{ summary()!.totalTransactions }}</div>
          </mat-card>

          <mat-card class="stat-card alert-stat">
            <mat-icon class="stat-icon warn-icon">gpp_bad</mat-icon>
            <div class="stat-label">Open Alerts</div>
            <div class="stat-value warn">{{ summary()!.openAlerts }}</div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon class="stat-icon">account_balance</mat-icon>
            <div class="stat-label">Transaction Volume</div>
            <div class="stat-value">
              {{ summary()!.totalTransactionVolume | currency:'ZAR':'symbol-narrow':'1.0-0' }}
            </div>
          </mat-card>
        </div>
      }

      <mat-tab-group>

        <!-- Users Tab -->
        <mat-tab label="Users">
          <div class="tab-content">
            <table mat-table [dataSource]="users()">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let u">{{ u.firstName }} {{ u.lastName }}</td>
              </ng-container>

              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let u">{{ u.email }}</td>
              </ng-container>

              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let u">
                  <span class="role-badge" [class]="u.role.toLowerCase()">{{ u.role }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let u">
                  <span class="status-badge" [class]="u.isActive ? 'active' : 'inactive'">
                    {{ u.isActive ? 'Active' : 'Suspended' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="joined">
                <th mat-header-cell *matHeaderCellDef>Joined</th>
                <td mat-cell *matCellDef="let u">{{ u.createdAt | date:'dd MMM yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let u">
                  <button mat-stroked-button
                    [color]="u.isActive ? 'warn' : 'primary'"
                    (click)="toggleUser(u)">
                    {{ u.isActive ? 'Suspend' : 'Activate' }}
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="userCols"></tr>
              <tr mat-row *matRowDef="let row; columns: userCols;"></tr>
            </table>
          </div>
        </mat-tab>

        <!-- Fraud Alerts Tab -->
        <mat-tab label="Fraud Alerts">
          <div class="tab-content">
            <div class="filter-row">
              @for (f of alertFilters; track f) {
                <button mat-stroked-button
                  [class.active-filter]="alertFilter() === f"
                  (click)="setAlertFilter(f)">
                  {{ f }}
                </button>
              }
            </div>

            @for (a of filteredAlerts(); track a.id) {
              <mat-card class="alert-row">
                <div class="alert-main">
                  <div class="risk-score" [class]="getRiskClass(a.riskScore)">
                    {{ a.riskScore | number:'1.0-0' }}
                  </div>
                  <div class="alert-detail">
                    <div class="alert-type">{{ a.alertType }}</div>
                    <div class="alert-user">
                      {{ a.user.email }} ·
                      R{{ a.transaction.amount | number:'1.0-0' }} ·
                      {{ a.transaction.category }}
                    </div>
                    <div class="alert-date">{{ a.createdAt | date:'dd MMM yyyy, HH:mm' }}</div>
                  </div>
                  <span class="status-badge" [class]="a.status.toLowerCase()">{{ a.status }}</span>
                  @if (a.status === 'Open') {
                    <button mat-stroked-button color="primary"
                      (click)="resolveAlert(a.id, 'Reviewed')">Review</button>
                    <button mat-stroked-button color="warn"
                      (click)="resolveAlert(a.id, 'Dismissed')">Dismiss</button>
                  }
                </div>
              </mat-card>
            }

            @if (filteredAlerts().length === 0) {
              <div class="empty">No alerts in this category.</div>
            }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page { padding: 28px; max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .subtitle { color: #888; margin: 4px 0 0; font-size: 14px; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card { padding: 20px; border-radius: 12px !important; }
    .stat-icon { font-size: 28px; height: 28px; width: 28px; color: #1976d2; margin-bottom: 8px; }
    .warn-icon { color: #f44336; }
    .stat-label { font-size: 13px; color: #888; margin-bottom: 4px; }
    .stat-value { font-size: 26px; font-weight: 700; }
    .warn { color: #c62828; }

    .tab-content { padding: 20px 0; }
    table { width: 100%; }

    .role-badge, .status-badge {
      padding: 3px 10px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }
    .role-badge.admin { background: #e8eaf6; color: #3949ab; }
    .role-badge.user { background: #f5f5f5; color: #555; }
    .status-badge.active, .status-badge.reviewed { background: #e8f5e9; color: #2e7d32; }
    .status-badge.inactive, .status-badge.open { background: #ffebee; color: #c62828; }
    .status-badge.dismissed { background: #f5f5f5; color: #757575; }

    .filter-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .active-filter { background: #1976d2 !important; color: white !important; }

    .alert-row { margin-bottom: 12px; padding: 16px; border-radius: 10px !important; }
    .alert-main { display: flex; align-items: center; gap: 14px; }

    .risk-score {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      flex-shrink: 0;
    }
    .risk-high { background: #ffebee; color: #c62828; }
    .risk-medium { background: #fff3e0; color: #e65100; }
    .risk-low { background: #fffde7; color: #f57f17; }

    .alert-detail { flex: 1; }
    .alert-type { font-weight: 600; font-size: 14px; }
    .alert-user { font-size: 13px; color: #666; }
    .alert-date { font-size: 12px; color: #aaa; }

    .empty { text-align: center; padding: 40px; color: #aaa; }

    @media (max-width: 768px) {
      .stat-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class AdminComponent implements OnInit {
  summary = signal<any>(null);
  users = signal<any[]>([]);
  alerts = signal<any[]>([]);
  alertFilter = signal('All');
  alertFilters = ['All', 'Open', 'Reviewed', 'Dismissed'];
  userCols = ['name', 'email', 'role', 'status', 'joined', 'actions'];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getSummary().subscribe(s => this.summary.set(s));
    this.adminService.getUsers().subscribe(u => this.users.set(u));
    this.adminService.getAlerts().subscribe(a => this.alerts.set(a));
  }

  filteredAlerts() {
    const f = this.alertFilter();
    return f === 'All' ? this.alerts() : this.alerts().filter((a: any) => a.status === f);
  }

  setAlertFilter(f: string) { this.alertFilter.set(f); }

  toggleUser(u: any) {
    this.adminService.toggleUser(u.id, !u.isActive).subscribe(() =>
      this.adminService.getUsers().subscribe(users => this.users.set(users))
    );
  }

  resolveAlert(id: number, action: string) {
    this.adminService.resolveAlert(id, action).subscribe(() =>
      this.adminService.getAlerts().subscribe(a => this.alerts.set(a))
    );
  }

  getRiskClass(score: number) {
    return score >= 70 ? 'risk-high' : score >= 40 ? 'risk-medium' : 'risk-low';
  }
}