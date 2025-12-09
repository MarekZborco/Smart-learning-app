import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

interface Achievement {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
}

interface Activity {
  icon: string;
  title: string;
  time: string;
  xp: number;
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
  router = inject(Router);
  
  currentUser = this.authService.currentUser;

  // Stats
  totalTests = 12;
  averageScore = 78;
  studyHours = 8;

  // Achievements
  achievements: Achievement[] = [
    {
      icon: '🎯',
      name: 'Prvý test',
      description: 'Dokončil si svoj prvý test',
      unlocked: true
    },
    {
      icon: '🔥',
      name: 'Streak 5',
      description: '5 dní po sebe',
      unlocked: true
    },
    {
      icon: '⭐',
      name: 'Level 1',
      description: 'Dosiahol si level 1',
      unlocked: true
    },
    {
      icon: '💯',
      name: 'Perfektný test',
      description: '100% úspešnosť',
      unlocked: false
    },
    {
      icon: '📚',
      name: 'Bookworm',
      description: 'Prečítal si 4 články',
      unlocked: false
    },
    {
      icon: '🏆',
      name: 'Majster',
      description: 'Dosiahol si level 10',
      unlocked: false
    }
  ];

  // Recent activity
  recentActivity: Activity[] = [
    {
      icon: '📝',
      title: 'Matematika test dokončený',
      time: 'Pred 2 hodinami',
      xp: 50
    },
    {
      icon: '📚',
      title: 'Prečítaný článok: Kombinatorika',
      time: 'Včera',
      xp: 10
    },
    {
      icon: '🎯',
      title: 'Matematika kvíz',
      time: 'Včera',
      xp: 30
    },
    {
      icon: '⭐',
      title: 'Dosiahnutý level 1',
      time: 'Pred 2 dňami',
      xp: 0
    }
  ];

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
    return this.currentUser()?.totalXP || 0;
  }

  get streak(): number {
    return this.currentUser()?.streak || 0;
  }

  get joinedDate(): string {
    return this.currentUser()?.joinedDate || 'November 2024';
  }

  get xpForNextLevel(): number {
    return Math.floor(100 * Math.pow(1.5, this.userLevel));
  }

  get xpPercentage(): number {
    return (this.currentXP / this.xpForNextLevel) * 100;
  }
}