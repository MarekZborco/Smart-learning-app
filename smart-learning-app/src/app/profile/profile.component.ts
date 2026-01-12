import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

interface Achievement {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  authService = inject(AuthService);
  userService = inject(UserService);
  
  currentUser = this.authService.currentUser;
  stats = this.userService.stats;
  activities = this.userService.activities;
  testResults = this.userService.testResults;

  get achievements(): Achievement[] {
    const user = this.currentUser();
    const stats = this.stats();
    const results = this.testResults();
    
    return [
      {
        icon: '🎯',
        name: 'Prvý test',
        description: 'Dokončil si svoj prvý test z matematiky',
        unlocked: stats.totalTests >= 1
      },
      {
        icon: '📝',
        name: 'Pilný študent',
        description: 'Dokončil si 5 testov',
        unlocked: stats.totalTests >= 5
      },
      {
        icon: '⭐',
        name: 'Level 3',
        description: 'Dosiahol si level 3',
        unlocked: (user?.level || 0) >= 3
      },
      {
        icon: '💯',
        name: 'Perfektný test',
        description: 'Dosiahol si 100% úspešnosť v teste',
        unlocked: results.some(t => t.percentage === 100)
      },
      {
        icon: '🔥',
        name: 'Streak 5',
        description: '5 dní po sebe',
        unlocked: (user?.streak || 0) >= 5
      },
      {
        icon: '🏆',
        name: 'Majster',
        description: 'Dosiahol si level 10',
        unlocked: (user?.level || 0) >= 10
      }
    ];
  }

  get userName(): string {
    return this.currentUser()?.name || 'Študent';
  }

  get userEmail(): string {
    return this.currentUser()?.email || 'student@learnhub.sk';
  }

  get userLevel(): number {
    return this.currentUser()?.level || 1;
  }

  get currentXP(): number {
    return this.currentUser()?.xp || 0;
  }

  get totalXP(): number {
    // KRITICKÉ: Použiť totalXP z usera, nie zo stats
    return this.currentUser()?.totalXP || 0;
  }

  get streak(): number {
    return this.currentUser()?.streak || 0;
  }

  get joinedDate(): string {
    return this.currentUser()?.joinedDate || 'Dnes';
  }

  get xpForNextLevel(): number {
    return Math.floor(100 * Math.pow(1.5, this.userLevel - 1));
  }

  get xpPercentage(): number {
    if (this.xpForNextLevel === 0) return 0;
    return (this.currentXP / this.xpForNextLevel) * 100;
  }

  // POUŽIŤ STATS Z UserService
  get totalTests(): number {
    return this.stats().totalTests;
  }

  get averageScore(): number {
    return this.stats().averageScore;
  }

  get studyHours(): number {
    return this.stats().studyHours;
  }

  // FORMÁTOVANÉ AKTIVITY
  get recentActivity() {
    return this.activities().slice(0, 4); // Zobraz len 4 najnovšie
  }
}