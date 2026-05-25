import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransactionService } from '../../core/services/api.service';
import { Transaction, TransactionRequest, CATEGORIES } from '../../core/models/models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatTooltipModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Transactions</h1>
          <p class="subtitle">Manage your income and expenses</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="triggerCsvUpload()">
            <mat-icon>upload_file</mat-icon> Import CSV
          </button>
          <input #csvInput type="file" accept=".csv" style="display:none"
            (change)="onCsvSelected($event)" />
          <button mat-raised-button color="primary" (click)="openForm()">
            <mat-icon>add</mat-icon> Add Transaction
          </button>
        </div>
      </div>

      @if (importResult()) {
        <mat-card class="import-result">
          <mat-icon>check_circle</mat-icon>
          Imported {{ importResult()!.imported }} transactions.
          Skipped {{ importResult()!.skipped }}.
          @if (importResult()!.errors.length > 0) {
            <span class="import-errors">{{ importResult()!.errors.length }} errors.</span>
          }
        </mat-card>
      }

      @if (showForm()) {
        <mat-card class="form-card">
          <h2>{{ editingId() ? 'Edit' : 'New' }} Transaction</h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="txn-form">
            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select formControlName="type">
                <mat-option value="Income">Income</mat-option>
                <mat-option value="Expense">Expense</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Amount (ZAR)</mat-label>
              <input matInput type="number" formControlName="amount" min="0.01" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                @for (c of categories; track c) {
                  <mat-option [value]="c">{{ c }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="dp" formControlName="date" />
              <mat-datepicker-toggle matIconSuffix [for]="dp" />
              <mat-datepicker #dp />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Merchant Name</mat-label>
              <input matInput formControlName="merchantName" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description" />
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelForm()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
                {{ editingId() ? 'Update' : 'Add' }}
              </button>
            </div>
          </form>
        </mat-card>
      }

      <mat-card class="table-card">
        <table mat-table [dataSource]="transactions()">
          <ng-container matColumnDef="flag">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let t">
              @if (t.isFlagged) {
                <mat-icon class="flag-icon"
                  [matTooltip]="'Risk score: ' + t.riskScore">gpp_bad</mat-icon>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let t">{{ t.date | date:'dd MMM yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let t">
              <span class="type-badge" [class]="t.type.toLowerCase()">{{ t.type }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let t">{{ t.category }}</td>
          </ng-container>

          <ng-container matColumnDef="merchant">
            <th mat-header-cell *matHeaderCellDef>Merchant</th>
            <td mat-cell *matCellDef="let t">{{ t.merchantName || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let t" [class]="t.type.toLowerCase() + '-val'">
              {{ t.type === 'Expense' ? '-' : '+' }}
              {{ t.amount | currency:'ZAR':'symbol-narrow':'1.0-0' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let t">
              <button mat-icon-button (click)="edit(t)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="delete(t.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"
            [class.flagged-row]="row.isFlagged"></tr>
        </table>

        @if (transactions().length === 0) {
          <div class="empty">No transactions yet.</div>
        }
      </mat-card>

      <mat-card class="csv-help">
        <mat-icon>info</mat-icon>
        <span>CSV format:
          <code>Date (yyyy-MM-dd), Amount, Type (Income/Expense), Category, Description, MerchantName</code>
        </span>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 28px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 28px; font-weight: 700; }
    h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; }
    .subtitle { color: #888; margin: 4px 0 0; font-size: 14px; }
    .header-actions { display: flex; gap: 10px; }

    .import-result {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
      background: #e8f5e9;
      border-radius: 8px !important;
    }
    .import-result mat-icon { color: #2e7d32; }
    .import-errors { color: #e65100; }

    .form-card { padding: 20px; margin-bottom: 20px; border-radius: 12px !important; }
    .txn-form { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 16px; }
    .form-actions { grid-column: 1/-1; display: flex; gap: 12px; justify-content: flex-end; }

    .table-card { border-radius: 12px !important; overflow: hidden; margin-bottom: 12px; }
    table { width: 100%; }

    .flag-icon { color: #f44336; font-size: 18px; height: 18px; width: 18px; }

    .type-badge { padding: 3px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; }
    .type-badge.income { background: #e8f5e9; color: #2e7d32; }
    .type-badge.expense { background: #ffebee; color: #c62828; }

    .income-val { color: #2e7d32; font-weight: 600; }
    .expense-val { color: #c62828; font-weight: 600; }
    .flagged-row { background: #fff8f8; }

    .empty { text-align: center; padding: 40px; color: #aaa; }

    .csv-help {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      font-size: 13px;
      color: #666;
      border-radius: 8px !important;
    }
    .csv-help mat-icon { font-size: 18px; color: #1976d2; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  `]
})
export class TransactionsComponent implements OnInit {
  transactions = signal<Transaction[]>([]);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  importResult = signal<{ imported: number; skipped: number; errors: string[] } | null>(null);
  categories = CATEGORIES;
  cols = ['flag', 'date', 'type', 'category', 'merchant', 'amount', 'actions'];
  form;

  constructor(private svc: TransactionService, private fb: FormBuilder) {
    this.form = this.fb.group({
      type: ['Expense', Validators.required],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      date: [new Date(), Validators.required],
      merchantName: [''],
      description: ['']
    });
  }

  ngOnInit() { this.load(); }

  load() { this.svc.getAll().subscribe(t => this.transactions.set(t)); }

  openForm() {
    this.showForm.set(true);
    this.editingId.set(null);
    this.form.reset({ type: 'Expense', date: new Date() });
  }

  cancelForm() { this.showForm.set(false); }

  edit(t: Transaction) {
    this.editingId.set(t.id);
    this.showForm.set(true);
    this.form.patchValue({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: new Date(t.date),
      merchantName: t.merchantName || '',
      description: t.description || ''
    });
  }

  submit() {
    if (this.form.invalid) return;
    const req = {
      ...this.form.value,
      date: new Date(this.form.value.date!).toISOString()
    } as TransactionRequest;

    const op = this.editingId()
      ? this.svc.update(this.editingId()!, req)
      : this.svc.create(req);

    op.subscribe(() => { this.cancelForm(); this.load(); });
  }

  delete(id: number) {
    if (confirm('Delete this transaction?'))
      this.svc.delete(id).subscribe(() => this.load());
  }

  triggerCsvUpload() {
    (document.querySelector('input[type=file]') as HTMLElement)?.click();
  }

  onCsvSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.svc.importCsv(file).subscribe(r => { this.importResult.set(r); this.load(); });
  }
}