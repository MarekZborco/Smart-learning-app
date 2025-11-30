import { Injectable, signal } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  totalXP: number;
  streak: number;
  joinedDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  
  currentUser = this.currentUserSignal.asReadonly();

  constructor() {
    this.loadUserFromStorage();
  }

  login(email: string, password: string): boolean {
    // Zatiaľ jednoduchý mock login
    if (email && password) {
      const user: User = {
        id: '1',
        name: email.split('@')[0],
        email: email,
        level: 1,
        xp: 0,
        totalXP: 0,
        streak: 0,
        joinedDate: new Date().toLocaleDateString('sk-SK')
      };
      
      this.currentUserSignal.set(user);
      localStorage.setItem('learnhub_user', JSON.stringify(user));
      return true;
    }
    return false;
  }

  register(name: string, email: string, password: string): boolean {
    if (name && email && password) {
      const user: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
        level: 1,
        xp: 0,
        totalXP: 0,
        streak: 0,
        joinedDate: new Date().toLocaleDateString('sk-SK')
      };
      
      this.currentUserSignal.set(user);
      localStorage.setItem('learnhub_user', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem('learnhub_user');
  }

  isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('learnhub_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.currentUserSignal.set(user);
    }
  }

  updateUser(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem('learnhub_user', JSON.stringify(user));
  }
}