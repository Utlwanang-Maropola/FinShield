import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthResponse } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'fs_token';
  private readonly USER_KEY = 'fs_user';

  // Signal that holds the current logged in user
  // Components can subscribe to this to react when the user logs in or out
  currentUser = signal<{ email: string; firstName: string; role: string } | null>(
    this.loadUser()
  );

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.setSession(res)));
  }

  register(email: string, password: string, firstName: string, lastName: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, { email, password, firstName, lastName })
      .pipe(tap(res => this.setSession(res)));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken = () => localStorage.getItem(this.TOKEN_KEY);
  isAuthenticated = () => !!this.getToken();
  isAdmin = () => this.currentUser()?.role === 'Admin';

  // Saves the token and user info to localStorage
  // so the user stays logged in after a page refresh
  private setSession(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    const user = { email: res.email, firstName: res.firstName, role: res.role };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  // Loads the user from localStorage on app startup
  private loadUser() {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}