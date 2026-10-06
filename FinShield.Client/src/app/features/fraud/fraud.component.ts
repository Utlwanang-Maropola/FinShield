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
  templateUrl: './fraud.component.html',
  styleUrls: ['./fraud.component.css']
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