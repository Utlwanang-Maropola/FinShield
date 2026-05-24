import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService } from '../../core/services/api.service';
import { DashboardSummary } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DecimalPipe, RouterLink,
    MatCardModule, MatIconModule, MatProgressBarModule, MatButtonModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Dashboard</h1>
        <p class="subtitle">{{ monthLabel }}</p>
      </div>

      @if (summary()) {

        <!-- Summary Cards -->
        <div class="stat-grid">
          <mat-card class="stat-card">
            <mat-icon class="stat-icon income-icon">trending_up</mat-icon>
            <div class="stat-label">Total Income</div>
            <div class="stat-value income">
              {{ summary()!.totalIncome | currency:'ZAR':'symbol-narrow':'1.0-0' }}
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon class="stat-icon expense-icon">trending_down</mat-icon>
            <div class="stat-label">Total Expenses</div>
            <div class="stat-value expense">
              {{ summary()!.totalExpenses | currency:'ZAR':'symbol-narrow':'1.0-0' }}
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon class="stat-icon savings-icon">savings</mat-icon>
            <div class="stat-label">Net Savings</div>
            <div class="stat-value"
              [class.income]="summary()!.netSavings >= 0"
              [class.expense]="summary()!.netSavings < 0">
              {{ summary()!.netSavings | currency:'ZAR':'symbol-narrow':'1.0-0' }}
            </div>
            <div class="stat-sub">{{ summary()!.savingsRate | number:'1.0-0' }}% savings rate</div>
          </mat-card>

          <mat-card class="stat-card"
            [class.alert-card]="summary()!.openFraudAlerts > 0"
            routerLink="/fraud"
            style="cursor:pointer">
            <mat-icon class="stat-icon"
              [class.alert-icon]="summary()!.openFraudAlerts > 0"
              [class.safe-icon]="summary()!.openFraudAlerts === 0">
              {{ summary()!.openFraudAlerts > 0 ? 'gpp_bad' : 'verified_user' }}
            </mat-icon>
            <div class="stat-label">Open Fraud Alerts</div>
            <div class="stat-value"
              [class.expense]="summary()!.openFraudAlerts > 0"
              [class.income]="summary()!.openFraudAlerts === 0">
              {{ summary()!.openFraudAlerts }}
            </div>
            <div class="stat-sub">
              {{ summary()!.openFraudAlerts > 0 ? 'Click to review' : 'All clear' }}
            </div>
          </mat-card>
        </div>

        <!-- Spending by Category and Budget Status -->
        <div class="bottom-grid">
          <mat-card class="section-card">
            <h2>Spending by Category</h2>
            @if (summary()!.spendingByCategory.length > 0) {
              @for (cat of summary()!.spendingByCategory; track cat.category) {
                <div class="cat-row">
                  <div class="cat-info">
                    <span class="cat-name">{{ cat.category }}</span>
                    <span class="cat-amount">
                      {{ cat.amount | currency:'ZAR':'symbol-narrow':'1.0-0' }}
                    </span>
                  </div>
                  <mat-progress-bar [value]="cat.percentage" color="primary" />
                  <span class="cat-pct">{{ cat.percentage | number:'1.0-0' }}%</span>
                </div>
              }
            } @else {
              <p class="empty">No expenses this month.</p>
            }
          </mat-card>

          <mat-card class="section-card">
            <h2>Budget Status</h2>
            @if (summary()!.budgetStatuses.length > 0) {
              @for (b of summary()!.budgetStatuses; track b.category) {
                <div class="budget-row">
                  <div class="budget-info">
                    <span class="cat-name">{{ b.category }}</span>
                    @if (b.isOverBudget) {
                      <span class="over-badge">OVER</span>
                    }
                    <span class="cat-amount">
                      {{ b.spent | currency:'ZAR':'symbol-narrow':'1.0-0' }} /
                      {{ b.limit | currency:'ZAR':'symbol-narrow':'1.0-0' }}
                    </span>
                  </div>
                  <mat-progress-bar
                    [value]="b.percentUsed"
                    [color]="b.isOverBudget ? 'warn' : b.percentUsed > 80 ? 'accent' : 'primary'" />
                </div>
              }
            } @else {
              <p class="empty">No budgets set.</p>
            }
          </mat-card>
        </div>

        <!-- Monthly Trends -->
        <mat-card class="section-card">
          <h2>Monthly Trends (Last 6 Months)</h2>
          <div class="trends-table">
            <div class="trend-header">
              <span>Month</span>
              <span>Income</span>
              <span>Expenses</span>
              <span>Net</span>
            </div>
            @for (t of summary()!.monthlyTrends; track t.month) {
              <div class="trend-row">
                <span>{{ t.month }}</span>
                <span class="income">
                  {{ t.income | currency:'ZAR':'symbol-narrow':'1.0-0' }}
                </span>
                <span class="expense">
                  {{ t.expenses | currency:'ZAR':'symbol-narrow':'1.0-0' }}
                </span>
                <span
                  [class.income]="t.income - t.expenses >= 0"
                  [class.expense]="t.income - t.expenses < 0">
                  {{ (t.income - t.expenses) | currency:'ZAR':'symbol-narrow':'1.0-0' }}
                </span>
              </div>
            }
          </div>
        </mat-card>

      } @else {
        <div class="loading">Loading dashboard...</div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px; max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    h1 { margin: 0; font-size: 28px; font-weight: 700; }
    h2 { margin: 0 0 16px; font-size: 17px; font-weight: 600; }
    .subtitle { color: #888; margin: 4px 0 0; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card { padding: 20px; border-radius: 12px !important; }
    .alert-card { border: 1px solid #ffcdd2; }

    .stat-icon { font-size: 32px; height: 32px; width: 32px; margin-bottom: 8px; }
    .income-icon { color: #4caf50; }
    .expense-icon { color: #f44336; }
    .savings-icon { color: #2196f3; }
    .alert-icon { color: #f44336; }
    .safe-icon { color: #4caf50; }

    .stat-label { font-size: 13px; color: #888; margin-bottom: 4px; }
    .stat-value { font-size: 26px; font-weight: 700; }
    .stat-sub { font-size: 12px; color: #aaa; margin-top: 2px; }

    .income { color: #2e7d32; }
    .expense { color: #c62828; }

    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .section-card { padding: 20px; border-radius: 12px !important; margin-bottom: 24px; }

    .cat-row, .budget-row { margin-bottom: 14px; }

    .cat-info, .budget-info {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }

    .cat-name { flex: 1; font-size: 14px; font-weight: 500; }
    .cat-amount { font-size: 13px; color: #555; }
    .cat-pct { font-size: 11px; color: #999; display: block; text-align: right; margin-top: 2px; }

    .over-badge {
      background: #ffebee;
      color: #c62828;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin: 0 8px;
    }

    .trend-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      padding: 8px 0;
      border-bottom: 2px solid #eee;
      font-weight: 600;
      color: #888;
      font-size: 12px;
      text-transform: uppercase;
    }

    .trend-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      padding: 10px 0;
      border-bottom: 1px solid #f5f5f5;
      font-size: 14px;
    }

    .empty { color: #aaa; font-size: 14px; text-align: center; padding: 20px 0; }
    .loading { text-align: center; padding: 60px; color: #aaa; }

    @media (max-width: 768px) {
      .bottom-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  summary = signal<DashboardSummary | null>(null);
  monthLabel = new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.getSummary().subscribe(d => this.summary.set(d));
  }
}