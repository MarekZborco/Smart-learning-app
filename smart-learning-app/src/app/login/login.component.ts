import { Component, inject } from '@angular/core';
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
  
  // Login data
  loginEmail = '';
  loginPassword = '';
  
  // Register data
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  registerPasswordConfirm = '';

  errorMessage = '';

  switchMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  onLogin(): void {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Vyplň všetky polia';
      return;
    }

    const success = this.authService.login(this.loginEmail, this.loginPassword);
    if (success) {
      this.router.navigate(['/']);
    } else {
      this.errorMessage = 'Nesprávny email alebo heslo';
    }
  }

  onRegister(): void {
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

    const success = this.authService.register(
      this.registerName,
      this.registerEmail,
      this.registerPassword
    );

    if (success) {
      this.router.navigate(['/']);
    } else {
      this.errorMessage = 'Registrácia zlyhala';
    }
  }
}