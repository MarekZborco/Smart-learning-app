import { Injectable, signal, computed } from '@angular/core';

export interface TestResult {
  id: string;
  subject: string;
  category: string;
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
  private testResultsSignal = signal<TestResult[]>([]);
  
  testResults = this.testResultsSignal.asReadonly();

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

    return {
      totalTests: results.length,
      averageScore: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
        : 0,
      testsByCategory,
      averageByCategory
    };
  });

  constructor() {
    this.loadDataFromStorage();
  }

  addTestResult(result: Omit<TestResult, 'id' | 'completedAt'>): void {
    const testResult: TestResult = {
      ...result,
      id: Date.now().toString(),
      completedAt: new Date()
    };

    this.testResultsSignal.update(results => [...results, testResult]);
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

  private saveDataToStorage(): void {
    const results = this.testResultsSignal().map(r => ({
      ...r,
      completedAt: r.completedAt.toISOString()
    }));
    localStorage.setItem('smartlearning_test_results', JSON.stringify(results));
  }

  private loadDataFromStorage(): void {
    const resultsJson = localStorage.getItem('smartlearning_test_results');

    if (resultsJson) {
      const results = JSON.parse(resultsJson).map((r: any) => ({
        ...r,
        completedAt: new Date(r.completedAt)
      }));
      this.testResultsSignal.set(results);
    }
  }

  clearAllData(): void {
    this.testResultsSignal.set([]);
    localStorage.removeItem('smartlearning_test_results');
  }
}