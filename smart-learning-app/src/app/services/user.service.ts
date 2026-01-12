import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface TestResult {
  id: string;
  subject: string;
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: Date;
  xpEarned: number;
  correctAnswers: number;
  totalQuestions: number;
  topics: string[];
}

export interface Activity {
  icon: string;
  title: string;
  time: string;
  xp: number;
}

export interface UserStats {
  totalTests: number;
  totalXP: number;
  averageScore: number;
  studyHours: number;
  currentStreak: number;
  testsByCategory: Map<string, number>;
  averageByCategory: Map<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authService = inject(AuthService);
  
  private testResultsSignal = signal<TestResult[]>([]);
  private activitiesSignal = signal<Activity[]>([]);
  
  testResults = this.testResultsSignal.asReadonly();
  activities = this.activitiesSignal.asReadonly();

  // Computed stats
  stats = computed<UserStats>(() => {
    const results = this.testResultsSignal();
    
    const testsByCategory = new Map<string, number>();
    const scoresByCategory = new Map<string, number[]>();

    results.forEach(r => {
      testsByCategory.set(r.category, (testsByCategory.get(r.category) || 0) + 1);
      
      if (!scoresByCategory.has(r.category)) {
        scoresByCategory.set(r.category, []);
      }
      scoresByCategory.get(r.category)!.push(r.percentage);
    });

    const averageByCategory = new Map<string, number>();
    scoresByCategory.forEach((scores, category) => {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      averageByCategory.set(category, Math.round(avg));
    });

    // KRITICKÉ: totalXP z usera, nie z výpočtu
    const user = this.authService.currentUser();
    const totalXP = user?.totalXP || 0;

    return {
      totalTests: results.length,
      totalXP: totalXP,
      averageScore: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
        : 0,
      studyHours: Math.floor(results.length * 0.5),
      currentStreak: user?.streak || 0,
      testsByCategory,
      averageByCategory
    };
  });

  constructor() {
    this.loadDataFromStorage();
  }

  addTestResult(result: Omit<TestResult, 'id' | 'completedAt' | 'xpEarned'>): void {
    const xpEarned = this.calculateXP(result.percentage, result.totalQuestions);
    
    const testResult: TestResult = {
      ...result,
      id: Date.now().toString(),
      completedAt: new Date(),
      xpEarned
    };

    // Pridaj do results
    this.testResultsSignal.update(results => [...results, testResult]);

    // NOVÉ: Aktualizuj XP v AuthService
    this.addXPToUser(xpEarned);

    // Pridaj aktivitu
    this.addActivity({
      icon: '📝',
      title: `${result.subject} dokončený`,
      time: this.getTimeAgo(new Date()),
      xp: xpEarned
    });

    this.saveDataToStorage();
  }

  // NOVÁ FUNKCIA: Pridaj XP užívateľovi
  private addXPToUser(xp: number): void {
    const user = this.authService.currentUser();
    if (!user) {
      console.error('No user logged in');
      return;
    }

    let newXP = user.xp + xp;
    let newLevel = user.level;
    let newTotalXP = user.totalXP + xp;
    
    const xpForNextLevel = Math.floor(100 * Math.pow(1.5, newLevel - 1));

    // Level up check
    while (newXP >= xpForNextLevel) {
      newXP -= xpForNextLevel;
      newLevel++;
      
      console.log('🎉 LEVEL UP!', newLevel);
      
      // Pridaj level up aktivitu
      this.addActivity({
        icon: '⭐',
        title: `Dosiahnutý level ${newLevel}`,
        time: 'Práve teraz',
        xp: 100
      });
    }

    // Update user
    this.authService.updateUser({
      ...user,
      xp: newXP,
      level: newLevel,
      totalXP: newTotalXP
    });

    console.log('✅ User updated:', {
      level: newLevel,
      xp: newXP,
      totalXP: newTotalXP,
      xpEarned: xp
    });
  }

  addActivity(activity: Activity): void {
    this.activitiesSignal.update(activities => [activity, ...activities].slice(0, 20));
    this.saveDataToStorage();
  }

  getResultsByCategory(category: string): TestResult[] {
    return this.testResultsSignal().filter(r => r.category === category);
  }

  getWeakTopics(): Array<{ topic: string; failedCount: number }> {
    const topicsFailed = new Map<string, number>();

    this.testResultsSignal().forEach(result => {
      if (result.percentage < 70) {
        result.topics.forEach(topic => {
          topicsFailed.set(topic, (topicsFailed.get(topic) || 0) + 1);
        });
      }
    });

    return Array.from(topicsFailed.entries())
      .map(([topic, failedCount]) => ({ topic, failedCount }))
      .sort((a, b) => b.failedCount - a.failedCount)
      .slice(0, 5);
  }

  private calculateXP(percentage: number, totalQuestions: number): number {
    let baseXP = totalQuestions * 2; // 2 XP za otázku
    
    if (percentage === 100) return baseXP * 2;
    if (percentage >= 80) return Math.round(baseXP * 1.5);
    if (percentage >= 60) return baseXP;
    if (percentage >= 40) return Math.round(baseXP * 0.7);
    return Math.round(baseXP * 0.5);
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Práve teraz';
    if (seconds < 3600) return `Pred ${Math.floor(seconds / 60)} minútami`;
    if (seconds < 86400) return `Pred ${Math.floor(seconds / 3600)} hodinami`;
    if (seconds < 172800) return 'Včera';
    return `Pred ${Math.floor(seconds / 86400)} dňami`;
  }

  private saveDataToStorage(): void {
    const results = this.testResultsSignal().map(r => ({
      ...r,
      completedAt: r.completedAt.toISOString()
    }));
    localStorage.setItem('learnhub_test_results', JSON.stringify(results));
    localStorage.setItem('learnhub_activities', JSON.stringify(this.activitiesSignal()));
  }

  private loadDataFromStorage(): void {
    const resultsJson = localStorage.getItem('learnhub_test_results');
    const activitiesJson = localStorage.getItem('learnhub_activities');

    if (resultsJson) {
      const results = JSON.parse(resultsJson).map((r: any) => ({
        ...r,
        completedAt: new Date(r.completedAt)
      }));
      this.testResultsSignal.set(results);
    }

    if (activitiesJson) {
      this.activitiesSignal.set(JSON.parse(activitiesJson));
    }
  }

  clearAllData(): void {
    this.testResultsSignal.set([]);
    this.activitiesSignal.set([]);
    localStorage.removeItem('learnhub_test_results');
    localStorage.removeItem('learnhub_activities');
  }
}