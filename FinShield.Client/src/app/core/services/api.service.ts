import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Transaction, TransactionRequest,
  FraudAlert, Budget, BudgetRequest,
  Insight, DashboardSummary, AdminSummary
} from '../models/models';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private http: HttpClient) {}

  getAll(month?: number, year?: number) {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year);
    return this.http.get<Transaction[]>(`${api}/transactions`, { params });
  }

  create(req: TransactionRequest) {
    return this.http.post<Transaction>(`${api}/transactions`, req);
  }

  update(id: number, req: TransactionRequest) {
    return this.http.put<Transaction>(`${api}/transactions/${id}`, req);
  }

  delete(id: number) {
    return this.http.delete(`${api}/transactions/${id}`);
  }

  importCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imported: number; skipped: number; errors: string[] }>(
      `${api}/transactions/import/csv`, formData
    );
  }
}

@Injectable({ providedIn: 'root' })
export class FraudService {
  constructor(private http: HttpClient) {}

  getAlerts() {
    return this.http.get<FraudAlert[]>(`${api}/fraud`);
  }

  resolve(id: number, action: 'Reviewed' | 'Dismissed') {
    return this.http.patch(`${api}/fraud/${id}/resolve`, { action });
  }
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  constructor(private http: HttpClient) {}

  getAll(month: number, year: number) {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<Budget[]>(`${api}/budgets`, { params });
  }

  create(req: BudgetRequest) {
    return this.http.post<Budget>(`${api}/budgets`, req);
  }

  update(id: number, req: BudgetRequest) {
    return this.http.put<Budget>(`${api}/budgets/${id}`, req);
  }

  delete(id: number) {
    return this.http.delete(`${api}/budgets/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class InsightService {
  constructor(private http: HttpClient) {}

  get(month?: number, year?: number) {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year);
    return this.http.get<Insight[]>(`${api}/insights`, { params });
  }

  generate(month?: number, year?: number) {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year);
    return this.http.post<Insight[]>(`${api}/insights/generate`, {}, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getSummary(month?: number, year?: number) {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year);
    return this.http.get<DashboardSummary>(`${api}/dashboard/summary`, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getSummary() {
    return this.http.get<AdminSummary>(`${api}/admin/summary`);
  }

  getUsers() {
    return this.http.get<any[]>(`${api}/admin/users`);
  }

  toggleUser(id: number, isActive: boolean) {
    return this.http.patch(`${api}/admin/users/${id}/toggle`, { isActive });
  }

  getAlerts(status?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${api}/admin/alerts`, { params });
  }

  resolveAlert(id: number, action: string) {
    return this.http.patch(`${api}/admin/alerts/${id}/resolve`, { action });
  }
}