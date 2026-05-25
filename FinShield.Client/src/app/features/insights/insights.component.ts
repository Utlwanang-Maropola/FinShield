import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { InsightService } from '../../core/services/api.service';
import { Insight } from '../../core/models/models';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [
    CommonModule, DatePipe, DecimalPipe,
    MatCardModule, MatIconModule, MatButtonModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>AI Financial Insights</h1>
          <p class="subtitle">Personalised analysis of your spending patterns</p>
        </div>
        <button mat-raised-button color="primary" (click)="generate()" [disabled]="loading()">
          <mat-icon>auto_awesome</mat-icon>
          {{ loading() ? 'Generating...' : 'Regenerate Insights' }}
        </button>
      </div>

      @if (insights().length === 0 && !loading()) {
        <mat-card class="empty-card">
          <mat-icon class="empty-icon">auto_awesome</mat-icon>
          <h2>No insights yet</h2>
          <p>Click "Regenerate Insights" to analyse your spending for this month.</p>
        </mat-card>
      }

      <div class="insights-grid">
        @for (insight of insights(); track insight.id) {
          <mat-card class="insight-card" [class]="'sev-' + insight.severity.toLowerCase()">

            <div class="insight-header">
              <mat-icon class="insight-icon">{{ getIcon(insight.type) }}</mat-icon>
              <div class="insight-title-block">
                <div class="insight-title">{{ insight.title }}</div>
                @if (insight.changePercent !== null && insight.changePercent !== undefined) {
                  <div class="change-badge" [class]="insight.changePercent > 0 ? 'up' : 'down'">
                    <mat-icon>{{ insight.changePercent > 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                    {{ insight.changePercent | number:'1.0-0' }}%
                  </div>
                }
              </div>
              <span class="sev-label" [class]="'sev-' + insight.severity.toLowerCase()">
                {{ insight.severity }}
              </span>
            </div>

            <p class="insight-message">{{ insight.message }}</p>
            <div class="insight-meta">{{ insight.generatedAt | date:'dd MMM yyyy, HH:mm' }}</div>

          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px; max-width: 1000px; margin: 0 auto; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .subtitle { color: #888; margin: 4px 0 0; font-size: 14px; }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 16px;
    }

    .insight-card {
      padding: 20px;
      border-radius: 12px !important;
      border-left: 4px solid #e0e0e0;
    }
    .insight-card.sev-critical { border-left-color: #f44336; background: #fffafa; }
    .insight-card.sev-warning { border-left-color: #ff9800; background: #fffdf7; }
    .insight-card.sev-info { border-left-color: #2196f3; }

    .insight-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .insight-icon {
      font-size: 28px;
      height: 28px;
      width: 28px;
      color: #1976d2;
      margin-top: 2px;
    }

    .insight-title-block { flex: 1; }
    .insight-title { font-weight: 600; font-size: 15px; }

    .change-badge {
      display: flex;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      margin-top: 2px;
    }
    .change-badge mat-icon { font-size: 14px; height: 14px; width: 14px; }
    .change-badge.up { color: #c62828; }
    .change-badge.down { color: #2e7d32; }

    .sev-label {
      padding: 3px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .sev-label.sev-critical { background: #ffebee; color: #c62828; }
    .sev-label.sev-warning { background: #fff3e0; color: #e65100; }
    .sev-label.sev-info { background: #e3f2fd; color: #1565c0; }

    .insight-message {
      margin: 0 0 10px;
      color: #444;
      font-size: 14px;
      line-height: 1.6;
    }

    .insight-meta { font-size: 12px; color: #aaa; }

    .empty-card {
      text-align: center;
      padding: 48px;
      border-radius: 12px !important;
    }
    .empty-icon {
      font-size: 56px;
      height: 56px;
      width: 56px;
      color: #1976d2;
      margin-bottom: 12px;
    }
    .empty-card h2 { margin: 0 0 8px; }
    .empty-card p { color: #888; margin: 0; }
  `]
})
export class InsightsComponent implements OnInit {
  insights = signal<Insight[]>([]);
  loading = signal(false);

  constructor(private insightService: InsightService) {}

  ngOnInit() {
    this.insightService.get().subscribe(i => this.insights.set(i));
  }

  generate() {
    this.loading.set(true);
    this.insightService.generate().subscribe({
      next: i => { this.insights.set(i); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getIcon(type: string): string {
    const map: Record<string, string> = {
      SpendingIncrease: 'trending_up',
      SpendingDecrease: 'trending_down',
      BudgetWarning: 'warning',
      BudgetExceeded: 'error',
      SavingsRate: 'savings',
      TopCategory: 'category'
    };
    return map[type] ?? 'insights';
  }
}