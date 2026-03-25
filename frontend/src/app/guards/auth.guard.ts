import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (_, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true';

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  if (isFirstLogin && state.url !== '/change-password') {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};
