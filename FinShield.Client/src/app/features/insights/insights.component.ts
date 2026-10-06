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
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.css']
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