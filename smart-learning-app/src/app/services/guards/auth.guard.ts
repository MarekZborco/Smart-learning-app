import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth.service';  // ✅ Z services/guards/ do services/
import { auth } from '../firebase.service';      // ✅ Z services/guards/ do services/

// Helper funkcia na čakanie na Firebase auth
function waitForAuthInit(): Promise<boolean> {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(!!user);
    });
  });
}

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔒 AUTH GUARD - START');
  
  // Počkaj na Firebase inicializáciu
  const isAuthenticated = await waitForAuthInit();
  
  console.log('🔒 AUTH GUARD - Firebase auth:', isAuthenticated);
  console.log('🔒 AUTH GUARD - currentUser:', authService.currentUser());

  if (isAuthenticated && authService.currentUser()) {
    console.log('✅ AUTH GUARD - ALLOWED');
    return true;
  } else {
    console.log('❌ AUTH GUARD - BLOCKED - redirecting to /login');
    router.navigate(['/login']);
    return false;
  }
};

export const loginGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔓 LOGIN GUARD - START');
  
  // Počkaj na Firebase inicializáciu
  const isAuthenticated = await waitForAuthInit();
  
  console.log('🔓 LOGIN GUARD - Firebase auth:', isAuthenticated);

  if (isAuthenticated) {
    console.log('🔓 LOGIN GUARD - User logged in, redirecting to /');
    router.navigate(['/']);
    return false;
  } else {
    console.log('✅ LOGIN GUARD - ALLOWED');
    return true;
  }
};