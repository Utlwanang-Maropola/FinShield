import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">

        <div class="auth-logo">
          <mat-icon>security</mat-icon>
          <h1>Create Account</h1>
          <p>Join FinShield</p>
        </div>

        @if (error()) {
          <div class="error-box">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="name-row">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Password (min 8 characters)</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>

          <button mat-raised-button color="primary" class="w-full submit-btn"
            type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="auth-link">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </p>

      </mat-card>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0d1b2a 0%, #1a3a5c 100%);
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 32px;
      border-radius: 16px !important;
    }

    .auth-logo {
      text-align: center;
      margin-bottom: 28px;
    }

    .auth-logo mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #1976d2;
    }

    .auth-logo h1 { margin: 8px 0 4px; font-size: 28px; font-weight: 700; }
    .auth-logo p { color: #888; margin: 0; font-size: 14px; }

    .name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 0;
    }

    .name-row mat-form-field { width: 100%; }

    .w-full { width: 100%; margin-bottom: 8px; }

    .submit-btn { width: 100%; height: 48px; font-size: 16px; margin-top: 8px; }

    .error-box {
      background: #ffebee;
      color: #c62828;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .auth-link { text-align: center; margin: 16px 0 0; font-size: 14px; color: #666; }
  `]
})
export class RegisterComponent {
  form;
  loading = signal(false);
  error = signal('');

  constructor(
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { email, password, firstName, lastName } = this.form.value;
    this.auth.register(email!, password!, firstName!, lastName!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error.set(e.error || 'Registration failed.');
        this.loading.set(false);
      }
    });
  }
}