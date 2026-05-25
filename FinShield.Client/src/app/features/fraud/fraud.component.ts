import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FraudService } from '../../core/services/api.service';
import { FraudAlert } from '../../core/models/models';

@Component({
  selector: 'app-fraud',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Fraud Alerts</h1>
          <p class="subtitle">Suspicious transactions flagged by the anomaly detection engine</p>
        </div>
      </div>

      <!-- Filter buttons -->
      <div class="filter-row">
        @for (f of filters; track f) {
          <button mat-stroked-button
            [class.active-filter]="activeFilter() === f"
            (click)="activeFilter.set(f)">
            {{ f }}
          </button>
        }
      </div>

      @if (filtered().length === 0) {
        <mat-card class="empty-card">
          <mat-icon class="empty-icon">verified_user</mat-icon>
          <h2>No alerts</h2>
          <p>{{ activeFilter() === 'Open'
            ? 'No open fraud alerts. Your account looks clean.'
            : 'No alerts in this category.' }}</p>
        </mat-card>
      }

      @for (alert of filtered(); track alert.id) {
        <mat-card class="alert-card" [class.open]="alert.status === 'Open'">

          <div class="alert-top">
            <div class="alert-left">
              <div class="risk-badge" [class]="getRiskClass(alert.riskScore)">
                {{ alert.riskScore | number:'1.0-0' }} RISK
              </div>
              <div>
                <div class="alert-type">{{ alert.alertType }}</div>
                <div class="alert-desc">{{ alert.description }}</div>
              </div>
            </div>

            <div class="alert-right">
              <span class="status-chip" [class]="alert.status.toLowerCase()">
                {{ alert.status }}
              </span>
              @if (alert.status === 'Open') {
                <button mat-stroked-button [matMenuTriggerFor]="menu" color="primary">
                  Resolve <mat-icon>arrow_drop_down</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="resolve(alert, 'Reviewed')">
                    <mat-icon>check_circle</mat-icon> Mark as Reviewed
                  </button>
                  <button mat-menu-item (click)="resolve(alert, 'Dismissed')">
                    <mat-icon>cancel</mat-icon> Dismiss
                  </button>
                </mat-menu>
              }
            </div>
          </div>

          <div class="transaction-info">
            <mat-icon>receipt</mat-icon>
            <span>{{ alert.transaction.category }}</span>
            <span class="sep">·</span>
            <strong>R{{ alert.transaction.amount | number:'1.0-0' }}</strong>
            <span class="sep">·</span>
            <span>{{ alert.transaction.merchantName || alert.transaction.description || '—' }}</span>
            <span class="sep">·</span>
            <span class="date">{{ alert.transaction.date | date:'dd MMM yyyy' }}</span>
          </div>

          <div class="alert-meta">Detected {{ alert.createdAt | date:'dd MMM yyyy, HH:mm' }}</div>

        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px; max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 20px; }
    h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .subtitle { color: #888; margin: 4px 0 0; font-size: 14px; }

    .filter-row { display: flex; gap: 8px; margin-bottom: 20px; }
    .active-filter { background: #1976d2 !important; color: white !important; }

    .alert-card {
      margin-bottom: 16px;
      padding: 20px;
      border-radius: 12px !important;
      border-left: 4px solid #e0e0e0;
    }
    .alert-card.open { border-left-color: #f44336; }

    .alert-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .alert-left { display: flex; gap: 14px; align-items: flex-start; flex: 1; }
    .alert-right { display: flex; align-items: center; gap: 10px; }

    .risk-badge {
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .risk-high { background: #ffebee; color: #c62828; }
    .risk-medium { background: #fff3e0; color: #e65100; }
    .risk-low { background: #fff9c4; color: #f57f17; }

    .alert-type { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
    .alert-desc { font-size: 13px; color: #666; }

    .status-chip {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-chip.open { background: #ffebee; color: #c62828; }
    .status-chip.reviewed { background: #e8f5e9; color: #2e7d32; }
    .status-chip.dismissed { background: #f5f5f5; color: #757575; }

    .transaction-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      background: #f9f9f9;
      padding: 10px 12px;
      border-radius: 8px;
      flex-wrap: wrap;
    }
    .transaction-info mat-icon { font-size: 16px; height: 16px; width: 16px; color: #888; }
    .sep { color: #ccc; }
    .date { color: #888; }

    .alert-meta { font-size: 12px; color: #aaa; margin-top: 8px; }

    .empty-card {
      text-align: center;
      padding: 48px;
      border-radius: 12px !important;
    }
    .empty-icon {
      font-size: 56px;
      height: 56px;
      width: 56px;
      color: #4caf50;
      margin-bottom: 12px;
    }
    .empty-card h2 { margin: 0 0 8px; }
    .empty-card p { color: #888; margin: 0; }
  `]
})
export class FraudComponent implements OnInit {
  alerts = signal<FraudAlert[]>([]);
  activeFilter = signal<string>('Open');
  filters = ['All', 'Open', 'Reviewed', 'Dismissed'];

  constructor(private fraudService: FraudService) {}

  ngOnInit() { this.load(); }

  load() { this.fraudService.getAlerts().subscribe(a => this.alerts.set(a)); }

  filtered() {
    const f = this.activeFilter();
    return f === 'All' ? this.alerts() : this.alerts().filter(a => a.status === f);
  }

  getRiskClass(score: number) {
    return score >= 70 ? 'risk-high' : score >= 40 ? 'risk-medium' : 'risk-low';
  }

  resolve(alert: FraudAlert, action: 'Reviewed' | 'Dismissed') {
    this.fraudService.resolve(alert.id, action).subscribe(() => this.load());
  }
}