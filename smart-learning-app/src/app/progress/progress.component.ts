import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService, TestResult } from '../services/user.service';
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
  @ViewChild('strongChart') strongChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weakChart') weakChartRef!: ElementRef<HTMLCanvasElement>;

  progressChart?: Chart;
  strongChart?: Chart;
  weakChart?: Chart;

  // Aktívny tab
  activeTab = signal<'matematika' | 'slovencina'>('matematika');

  testResults: TestResult[] = [];
  filteredResults: TestResult[] = [];
  
  weakTopics: TopicStats[] = [];
  strongTopics: TopicStats[] = [];
  recentImprovement = 0;

  userService = inject(UserService);

  stats = this.userService.stats;

  // Štatistiky podľa aktívneho tabu
  get currentStats() {
    if (this.activeTab() === 'matematika') {
      return this.userService.mathStats();
    }
    return this.userService.slovakStats();
  }

  // Mapovanie tém na kategórie - MATEMATIKA
  mathTopicCategoryMap: { [key: string]: string } = {
    'Faktoriál': 'kombinatorika',
    'Kombinatorické pravidlo súčinu': 'kombinatorika',
    'Kombinatorické pravidlo súčtu': 'kombinatorika',
    'Permutácie': 'kombinatorika',
    'Variácie bez opakovania': 'kombinatorika',
    'Variácie s opakovaním': 'kombinatorika',
    'Kombinácie': 'kombinatorika',
    'Kombinačné čísla': 'kombinatorika',
    'Rovnice s faktoriálom': 'kombinatorika',
    'Faktoriál prirodzeného čísla': 'kombinatorika',
    'Pravdepodobnosť náhodného javu': 'pravdepodobnost',
    'Náhodný jav': 'pravdepodobnost',
    'Opačný jav': 'pravdepodobnost',
    'Nezávislé javy': 'pravdepodobnost',
    'Podmienená pravdepodobnosť': 'pravdepodobnost',
    'Nezávislé pokusy': 'pravdepodobnost',
    'Bernoulliho schéma': 'pravdepodobnost',
    'Zjednotenie javov': 'pravdepodobnost',
    'Aritmetický priemer': 'statistika',
    'Medián': 'statistika',
    'Modus': 'statistika',
    'Variačné rozpätie': 'statistika',
    'Relatívna početnosť': 'statistika',
    'Rozptyl': 'statistika',
    'Rozptyl a smerodajná odchýlka': 'statistika',
    'Vážený priemer': 'statistika',
    'Variačný koeficient': 'statistika',
    'Vlastnosti priemeru a rozptylu': 'statistika',
    'Modus a medián': 'statistika',
    'Pojem postupnosti': 'postupnosti',
    'Aritmetická postupnosť': 'postupnosti',
    'Geometrická postupnosť': 'postupnosti',
    'Súčet AP': 'postupnosti',
    'Súčet GP': 'postupnosti',
    'Súčet nekonečnej GP': 'postupnosti'
  };

  // Mapovanie tém na kategórie - SLOVENČINA
  slovakTopicCategoryMap: { [key: string]: string } = {
    'Romantizmus': 'romantizmus',
    'Realizmus': 'realizmus',
    'Svetová literatúra': 'svetova-literatura',
    'Medzivojnová literatúra': 'medzivojnova-literatura',
    'Jazykové štýly': 'jazyk',
    'Slohové postupy': 'jazyk',
    'Slovné druhy': 'jazyk',
    'Lexikológia': 'jazyk',
    'Vetné členy': 'jazyk',
    'Súvetia': 'jazyk',
    'Morfológia': 'jazyk'
  };

  constructor() {
    effect(() => {
      const results = this.userService.testResults();
      this.testResults = results;
      this.filterAndUpdate();
      
      if (this.progressChart) {
        setTimeout(() => {
          this.destroyCharts();
          if (this.filteredResults.length > 0) {
            this.createCharts();
          }
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.testResults = this.userService.testResults();
    this.filterAndUpdate();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.filteredResults.length > 0) {
        this.createCharts();
      }
    }, 100);
  }

  selectTab(tab: 'matematika' | 'slovencina'): void {
    this.activeTab.set(tab);
    this.filterAndUpdate();
    
    setTimeout(() => {
      this.destroyCharts();
      if (this.filteredResults.length > 0) {
        this.createCharts();
      }
    }, 50);
  }

  private filterAndUpdate(): void {
    const tab = this.activeTab();
    this.filteredResults = this.testResults.filter(r => r.subjectType === tab);
    this.calculateTopicStats();
  }

  getCategoryForTopic(topic: string): string {
    if (this.activeTab() === 'matematika') {
      return this.mathTopicCategoryMap[topic] || 'kombinatorika';
    }
    return this.slovakTopicCategoryMap[topic] || 'romantizmus';
  }

  calculateTopicStats() {
    if (this.filteredResults.length === 0) {
      this.weakTopics = [];
      this.strongTopics = [];
      this.recentImprovement = 0;
      return;
    }

    const topicMap = new Map<string, { correct: number; total: number; attempts: number }>();

    this.filteredResults.forEach(result => {
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
    this.strongTopics = topicStats.filter(t => t.percentage >= 70).slice(-5).reverse();

    if (this.filteredResults.length >= 4) {
      const half = Math.floor(this.filteredResults.length / 2);
      const firstHalf = this.filteredResults.slice(0, half);
      const secondHalf = this.filteredResults.slice(half);
      
      const avgFirst = firstHalf.reduce((sum, r) => sum + r.percentage, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, r) => sum + r.percentage, 0) / secondHalf.length;
      
      this.recentImprovement = avgSecond - avgFirst;
    } else {
      this.recentImprovement = 0;
    }
  }

  createCharts() {
    if (this.filteredResults.length === 0) return;
    
    try {
      this.createProgressChart();
      this.createStrongChart();
      this.createWeakChart();
    } catch (error) {
      console.error('Error creating charts:', error);
    }
  }

  createProgressChart() {
    if (!this.progressChartRef?.nativeElement) return;
    
    const ctx = this.progressChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const recentTests = this.filteredResults.slice(-10);
    
    const isMath = this.activeTab() === 'matematika';
    const lineColor = isMath ? 'rgb(139, 92, 246)' : 'rgb(236, 72, 153)';
    const bgColor = isMath ? 'rgba(139, 92, 246, 0.2)' : 'rgba(236, 72, 153, 0.2)';
    const titleText = isMath ? 'Matematika - progres v čase' : 'Slovenčina - progres v čase';

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: recentTests.map((r, i) => `Test ${i + 1}`),
        datasets: [{
          label: 'Úspešnosť (%)',
          data: recentTests.map(r => r.percentage),
          borderColor: lineColor,
          backgroundColor: bgColor,
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
            text: titleText,
            color: '#fff',
            font: { size: 20, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { 
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 12, weight: 'normal' },
              callback: function(value) {
                return value + '%';
              }
            },
            grid: { 
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: { 
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 11, weight: 'normal' }
            },
            grid: { display: false }
          }
        }
      }
    };

    this.progressChart = new Chart(ctx, config);
  }

  createStrongChart() {
    if (!this.strongChartRef?.nativeElement) return;
    
    const ctx = this.strongChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const strongData = this.strongTopics.slice(0, 5);
    
    if (strongData.length === 0) return;

    const fullLabels = strongData.map(t => t.topic);
    const shortLabels = strongData.map(t => this.truncateLabel(t.topic, 20));

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [{
          label: 'Úspešnosť',
          data: strongData.map(t => Math.round(t.percentage)),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: 10 }
        },
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: {
            callbacks: {
              title: function(context) {
                const index = context[0].dataIndex;
                return fullLabels[index];
              },
              label: function(context) {
                return 'Úspešnosť: ' + context.parsed.x + '%';
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { 
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 10, weight: 'normal' },
              stepSize: 25,
              callback: function(value) {
                return value + '%';
              }
            },
            grid: { 
              color: 'rgba(34, 197, 94, 0.15)'
            }
          },
          y: {
            ticks: { 
              color: 'rgba(255, 255, 255, 0.9)',
              font: { size: 10, weight: 'normal' }
            },
            grid: { display: false }
          }
        }
      }
    };

    this.strongChart = new Chart(ctx, config);
  }

  createWeakChart() {
    if (!this.weakChartRef?.nativeElement) return;
    
    const ctx = this.weakChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const weakData = this.weakTopics.slice(0, 5);
    
    if (weakData.length === 0) return;

    const fullLabels = weakData.map(t => t.topic);
    const shortLabels = weakData.map(t => this.truncateLabel(t.topic, 20));

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [{
          label: 'Úspešnosť',
          data: weakData.map(t => Math.round(t.percentage)),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: 10 }
        },
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: {
            callbacks: {
              title: function(context) {
                const index = context[0].dataIndex;
                return fullLabels[index];
              },
              label: function(context) {
                return 'Úspešnosť: ' + context.parsed.x + '%';
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { 
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 10, weight: 'normal' },
              stepSize: 25,
              callback: function(value) {
                return value + '%';
              }
            },
            grid: { 
              color: 'rgba(239, 68, 68, 0.15)'
            }
          },
          y: {
            ticks: { 
              color: 'rgba(255, 255, 255, 0.9)',
              font: { size: 10, weight: 'normal' }
            },
            grid: { display: false }
          }
        }
      }
    };

    this.weakChart = new Chart(ctx, config);
  }

  truncateLabel(label: string, maxLength: number): string {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
  }

  private destroyCharts(): void {
    if (this.progressChart) { this.progressChart.destroy(); this.progressChart = undefined; }
    if (this.strongChart) { this.strongChart.destroy(); this.strongChart = undefined; }
    if (this.weakChart) { this.weakChart.destroy(); this.weakChart = undefined; }
  }

  updateCharts() {
    if (this.filteredResults.length === 0) return;
    this.destroyCharts();
    this.createCharts();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }
}
