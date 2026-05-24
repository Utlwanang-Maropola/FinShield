import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Protects routes that require the user to be logged in
// If not logged in, redirects to the login page
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/auth/login']);
};

// Protects routes that require the Admin role
// If not logged in, redirects to login
// If logged in but not admin, redirects to dashboard
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  if (!auth.isAdmin()) return router.createUrlTree(['/dashboard']);
  return true;
};