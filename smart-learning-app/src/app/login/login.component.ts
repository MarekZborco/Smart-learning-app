import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  isLoginMode = true;
  
  loginEmail = '';
  loginPassword = '';
  
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  registerPasswordConfirm = '';

  errorMessage = '';
  loading = false;
  
  private redirecting = false;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && !this.redirecting) {
        this.redirecting = true;
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 100);
      }
    });
  }

  switchMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  async onLogin(): Promise<void> {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Vyplň všetky polia';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const result = await this.authService.login(this.loginEmail, this.loginPassword);
    
    if (!result.success) {
      this.loading = false;
      this.errorMessage = result.message || 'Prihlásenie zlyhalo';
    }
  }

  async onRegister(): Promise<void> {
    if (!this.registerName || !this.registerEmail || !this.registerPassword) {
      this.errorMessage = 'Vyplň všetky polia';
      return;
    }

    if (this.registerPassword !== this.registerPasswordConfirm) {
      this.errorMessage = 'Heslá sa nezhodujú';
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage = 'Heslo musí mať aspoň 6 znakov';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const result = await this.authService.register(
      this.registerName,
      this.registerEmail,
      this.registerPassword
    );

    if (!result.success) {
      this.loading = false;
      this.errorMessage = result.message || 'Registrácia zlyhala';
    }
  }
}