import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';
import { ref, set, get } from 'firebase/database';
import { realtimeDb } from './firebase.service';

export interface TestResult {
  id: string;
  subject: string;
  category: string;
  subjectType: string; // 'matematika' alebo 'slovencina'
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: Date;
  correctAnswers: number;
  totalQuestions: number;
  topics: string[];
}

export interface UserStats {
  totalTests: number;
  averageScore: number;
  testsByCategory: Map<string, number>;
  averageByCategory: Map<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authService = inject(AuthService);
  private testResultsSignal = signal<TestResult[]>([]);
  
  testResults = this.testResultsSignal.asReadonly();

  // Celkové štatistiky (oba predmety spolu)
  stats = computed<UserStats>(() => {
    const results = this.testResultsSignal();
    return this.calculateStats(results);
  });

  // Štatistiky LEN pre matematiku
  mathStats = computed<UserStats>(() => {
    const results = this.testResultsSignal().filter(r => r.subjectType === 'matematika');
    return this.calculateStats(results);
  });

  // Štatistiky LEN pre slovenčinu
  slovakStats = computed<UserStats>(() => {
    const results = this.testResultsSignal().filter(r => r.subjectType === 'slovencina');
    return this.calculateStats(results);
  });

  // Posledné testy LEN pre matematiku
  mathResults = computed<TestResult[]>(() => {
    return this.testResultsSignal().filter(r => r.subjectType === 'matematika');
  });

  // Posledné testy LEN pre slovenčinu
  slovakResults = computed<TestResult[]>(() => {
    return this.testResultsSignal().filter(r => r.subjectType === 'slovencina');
  });

  private calculateStats(results: TestResult[]): UserStats {
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

    return {
      totalTests: results.length,
      averageScore: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
        : 0,
      testsByCategory,
      averageByCategory
    };
  }

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadDataFromFirebase(user.id);
      } else {
        this.testResultsSignal.set([]);
      }
    });
  }

  addTestResult(result: Omit<TestResult, 'id' | 'completedAt'>): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const testResult: TestResult = {
      ...result,
      id: Date.now().toString(),
      completedAt: new Date()
    };

    this.testResultsSignal.update(results => [...results, testResult]);
    this.saveDataToFirebase(currentUser.id);
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

  private saveDataToFirebase(userId: string): void {
    const results = this.testResultsSignal().map(r => ({
      ...r,
      completedAt: r.completedAt.toISOString()
    }));
    
    const resultsRef = ref(realtimeDb, `test-results/${userId}`);
    
    set(resultsRef, results)
      .then(() => console.log('Test results saved to Firebase for user:', userId))
      .catch((err) => console.error('Could not save test results:', err));
  }

  private loadDataFromFirebase(userId: string): void {
    const resultsRef = ref(realtimeDb, `test-results/${userId}`);
    
    get(resultsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const results = snapshot.val().map((r: any) => ({
            ...r,
            subjectType: r.subjectType || 'matematika', // fallback pre staré dáta
            completedAt: new Date(r.completedAt)
          }));
          this.testResultsSignal.set(results);
          console.log('Test results loaded from Firebase for user:', userId, results.length);
        } else {
          this.testResultsSignal.set([]);
          console.log('No test results found for user:', userId);
        }
      })
      .catch((err) => {
        console.error('Could not load test results:', err);
        this.testResultsSignal.set([]);
      });
  }

  clearAllData(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;
    
    this.testResultsSignal.set([]);
    
    const resultsRef = ref(realtimeDb, `test-results/${currentUser.id}`);
    set(resultsRef, [])
      .then(() => console.log('Test results cleared for user:', currentUser.id))
      .catch((err) => console.error('Could not clear test results:', err));
  }
}