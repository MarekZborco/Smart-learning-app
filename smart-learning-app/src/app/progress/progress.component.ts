import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService, TestResult } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { 
  Chart, 
  ChartConfiguration,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  RadarController
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  RadarController
);

interface TopicStats {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
  attempts: number;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.css'
})
export class ProgressComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('progressChart') progressChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topicsChart') topicsChartRef!: ElementRef<HTMLCanvasElement>;

  progressChart?: Chart;
  categoryChart?: Chart;
  topicsChart?: Chart;

  testResults: TestResult[] = [];
  
  weakTopics: TopicStats[] = [];
  strongTopics: TopicStats[] = [];
  recentImprovement = 0;

  userService = inject(UserService);
  authService = inject(AuthService);

  stats = this.userService.stats;
  user = this.authService.currentUser;

  constructor() {
    effect(() => {
      const results = this.userService.testResults();
      this.testResults = results;
      this.calculateTopicStats();
      
      if (this.progressChart) {
        setTimeout(() => this.updateCharts(), 100);
      }
    });
  }

  ngOnInit() {
    this.testResults = this.userService.testResults();
    this.calculateTopicStats();
    console.log('Test results:', this.testResults);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.testResults.length > 0) {
        this.createCharts();
      } else {
        console.log('No test results yet - charts will not be created');
      }
    }, 100);
  }

  calculateTopicStats() {
    if (this.testResults.length === 0) return;

    const topicMap = new Map<string, { correct: number; total: number; attempts: number }>();

    this.testResults.forEach(result => {
      result.topics.forEach(topic => {
        if (!topicMap.has(topic)) {
          topicMap.set(topic, { correct: 0, total: 0, attempts: 0 });
        }
        const stats = topicMap.get(topic)!;
        stats.total += result.totalQuestions;
        stats.correct += result.correctAnswers;
        stats.attempts += 1;
      });
    });

    const topicStats: TopicStats[] = Array.from(topicMap.entries()).map(([topic, stats]) => ({
      topic,
      correct: stats.correct,
      total: stats.total,
      percentage: (stats.correct / stats.total) * 100,
      attempts: stats.attempts
    }));

    topicStats.sort((a, b) => a.percentage - b.percentage);

    this.weakTopics = topicStats.filter(t => t.percentage < 70).slice(0, 5);
    this.strongTopics = topicStats.filter(t => t.percentage >= 80).slice(-5).reverse();

    if (this.testResults.length >= 4) {
      const half = Math.floor(this.testResults.length / 2);
      const firstHalf = this.testResults.slice(0, half);
      const secondHalf = this.testResults.slice(half);
      
      const avgFirst = firstHalf.reduce((sum, r) => sum + r.percentage, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, r) => sum + r.percentage, 0) / secondHalf.length;
      
      this.recentImprovement = avgSecond - avgFirst;
    }
  }

  createCharts() {
    if (this.testResults.length === 0) return;
    
    try {
      this.createProgressChart();
      this.createCategoryChart();
      this.createTopicsChart();
      console.log('Charts created successfully');
    } catch (error) {
      console.error('Error creating charts:', error);
    }
  }

  createProgressChart() {
    if (!this.progressChartRef?.nativeElement) {
      console.log('Progress chart ref not found');
      return;
    }
    
    const ctx = this.progressChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const recentTests = this.testResults.slice(-10);
    
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: recentTests.map((r, i) => `Test ${i + 1}`),
        datasets: [{
          label: 'Úspešnosť (%)',
          data: recentTests.map(r => r.percentage),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 9,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Tvoj progres v čase',
            color: '#fff',
            font: { size: 22, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { 
              color: 'rgba(255, 255, 255, 0.9)',
              font: { size: 16, weight: '500' }
            },
            grid: { 
              color: 'rgba(255, 255, 255, 0.15)'
            }
          },
          x: {
            ticks: { 
              color: 'rgba(255, 255, 255, 0.9)',
              font: { size: 14, weight: '500' }
            },
            grid: { display: false }
          }
        }
      }
    };

    this.progressChart = new Chart(ctx, config);
    console.log('Progress chart created');
  }

  createCategoryChart() {
    if (!this.categoryChartRef?.nativeElement) {
      console.log('Category chart ref not found');
      return;
    }
    
    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const categoryMap = new Map<string, number[]>();
    
    this.testResults.forEach(result => {
      if (!categoryMap.has(result.category)) {
        categoryMap.set(result.category, []);
      }
      categoryMap.get(result.category)!.push(result.percentage);
    });

    const categories = Array.from(categoryMap.keys());
    const averages = categories.map(cat => {
      const scores = categoryMap.get(cat)!;
      return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    });

    const colors = [
      'rgba(139, 92, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(251, 146, 60, 0.8)',
      'rgba(34, 197, 94, 0.8)'
    ];

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Priemerná úspešnosť',
          data: averages,
          backgroundColor: colors.slice(0, categories.length),
          borderWidth: 2,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Úspešnosť podľa kategórií',
            color: '#fff',
            font: { size: 22, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { 
              color: 'rgba(255, 255, 255, 0.9)',
              font: { size: 16, weight: '500' }
            },
            grid: { 
              color: 'rgba(255, 255, 255, 0.15)'
            }
          },
          x: {
            ticks: { 
              color: 'rgba(255, 255, 255, 0.9)',
              font: { size: 14, weight: '500' }
            },
            grid: { display: false }
          }
        }
      }
    };

    this.categoryChart = new Chart(ctx, config);
    console.log('Category chart created');
  }

 createTopicsChart() {
  if (!this.topicsChartRef?.nativeElement) {
    console.log('Topics chart ref not found');
    return;
  }
  
  const ctx = this.topicsChartRef.nativeElement.getContext('2d');
  if (!ctx) return;

  const topicMap = new Map<string, { correct: number; total: number }>();

  this.testResults.forEach(result => {
    result.topics.forEach(topic => {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { correct: 0, total: 0 });
      }
      const stats = topicMap.get(topic)!;
      stats.total += result.totalQuestions;
      stats.correct += result.correctAnswers;
    });
  });

  const topicStats = Array.from(topicMap.entries())
    .map(([topic, stats]) => ({
      topic,
      percentage: Math.round((stats.correct / stats.total) * 100)
    }))
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 10);

  const topics = topicStats.map(t => t.topic);
  const percentages = topicStats.map(t => t.percentage);

  const backgroundColors = percentages.map(p => {
    if (p >= 80) return 'rgba(34, 197, 94, 0.8)';
    if (p >= 60) return 'rgba(251, 146, 60, 0.8)';
    return 'rgba(239, 68, 68, 0.8)';
  });

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: topics,
      datasets: [{
        label: 'Úspešnosť (%)',
        data: percentages,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          position: 'bottom',
          labels: {
            color: '#fff',
            font: { size: 14, weight: '500' },
            padding: 15,
            generateLabels: function() {
              return [
                {
                  text: '🟢 Dobré (80%+)',
                  fillStyle: 'rgba(34, 197, 94, 0.8)',
                  hidden: false,
                  index: 0
                },
                {
                  text: '🟠 OK (60-79%)',
                  fillStyle: 'rgba(251, 146, 60, 0.8)',
                  hidden: false,
                  index: 1
                },
                {
                  text: '🔴 Slabé (<60%)',
                  fillStyle: 'rgba(239, 68, 68, 0.8)',
                  hidden: false,
                  index: 2
                }
              ];
            }
          }
        },
        title: {
          display: true,
          text: 'Silné a slabé stránky podľa tém',
          color: '#fff',
          font: { size: 22, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: { 
            color: 'rgba(255, 255, 255, 0.9)',
            font: { size: 14, weight: '500' },
            callback: function(value) {
              return value + '%';
            }
          },
          grid: { 
            color: 'rgba(255, 255, 255, 0.15)'
          }
        },
        y: {
          ticks: { 
            color: 'rgba(255, 255, 255, 0.9)',
            font: { size: 13, weight: '500' }
          },
          grid: { display: false }
        }
      }
    }
  };

  this.topicsChart = new Chart(ctx, config);
  console.log('Topics chart created');
}
  updateCharts() {
    if (this.testResults.length === 0) return;
    
    if (this.progressChart) {
      this.progressChart.destroy();
      this.createProgressChart();
    }
    
    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.createCategoryChart();
    }
    
    if (this.topicsChart) {
      this.topicsChart.destroy();
      this.createTopicsChart();
    }
  }

  get xpForNextLevel(): number {
    const currentUser = this.user();
    if (!currentUser) return 100;
    return Math.floor(100 * Math.pow(1.5, currentUser.level - 1));
  }

  get xpPercentage(): number {
    const currentUser = this.user();
    if (!currentUser) return 0;
    return (currentUser.xp / this.xpForNextLevel) * 100;
  }

  ngOnDestroy() {
    if (this.progressChart) this.progressChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.topicsChart) this.topicsChart.destroy();
  }
}