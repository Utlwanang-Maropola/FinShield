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
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
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