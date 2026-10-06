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
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
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