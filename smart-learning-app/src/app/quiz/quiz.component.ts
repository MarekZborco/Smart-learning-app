import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { FirebaseService, Question } from '../services/firebase.service';
import { CalculatorComponent } from '../calculator/calculator.component';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink, CalculatorComponent],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css'
})
export class QuizComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private firebaseService = inject(FirebaseService);

  questions = signal<Question[]>([]);
  currentQuestion = 0;
  selectedAnswer: number | null = null;
  score = 0;
  correctAnswers = 0;
  quizFinished = false;
  quizStarted = false;
  loading = false;
  error = signal<string | null>(null);
  selectedCategory = '';
  selectedSubject = '';

  showingResult = false;
  isCorrect = false;
  correctAnswerIndex: number | null = null;
  showExplanation = false;
  showCalculator = false;

  // Výber režimu (nový stav medzi výberom kategórie a kvízom)
  modeSelection = false;

  // Časovač
  timedMode = false;
  timeLimit = 0;        // celkový čas v sekundách (0 = bez limitu)
  timeRemaining = 0;
  private timerInterval: any = null;

  ngOnInit() {}

  ngOnDestroy() {
    this.stopTimer();
  }

  toggleCalculator(): void {
    this.showCalculator = !this.showCalculator;
  }

  // Po kliknutí na kategóriu - zobraz výber režimu
  selectCategory(category: string, subject: string) {
    this.selectedCategory = category;
    this.selectedSubject = subject;
    this.modeSelection = true; // Zobraz výber režimu
  }

  // Spusti kvíz s vybraným režimom
  startQuiz(timed: boolean, seconds: number = 0) {
    this.timedMode = timed;
    this.timeLimit = seconds;
    this.timeRemaining = seconds;
    this.modeSelection = false;
    this.quizStarted = true;
    this.loadQuestions();
  }

  backToCategories() {
    this.stopTimer();
    this.quizStarted = false;
    this.quizFinished = false;
    this.modeSelection = false;
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.correctAnswers = 0;
    this.showingResult = false;
    this.showExplanation = false;
    this.selectedSubject = '';
    this.timedMode = false;
    this.timeLimit = 0;
    this.timeRemaining = 0;
    this.questions.set([]);
  }

  backToModeSelection() {
    this.stopTimer();
    this.modeSelection = true;
    this.quizStarted = false;
    this.quizFinished = false;
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.correctAnswers = 0;
    this.showingResult = false;
    this.showExplanation = false;
    this.timedMode = false;
    this.timeLimit = 0;
    this.timeRemaining = 0;
    this.questions.set([]);
  }

  getCategoryName(): string {
    const names: { [key: string]: string } = {
      'kombinatorika': 'Kombinatorika',
      'pravdepodobnost': 'Pravdepodobnosť',
      'statistika': 'Štatistika',
      'postupnosti': 'Postupnosti',
      'literatura': 'Literatúra',
      'slovensky-jazyk': 'Slovenský jazyk',
    };
    return names[this.selectedCategory] || 'Test';
  }

  getSubjectPrefix(): string {
    return this.selectedSubject === 'matematika' ? 'Matematika - ' : 'Slovenčina - ';
  }

  loadQuestions() {
    this.loading = true;
    this.error.set(null);

    this.firebaseService.getQuestions(this.selectedCategory).subscribe({
      next: (questions) => {
        if (questions.length === 0) {
          this.error.set('Žiadne otázky pre túto kategóriu');
          this.loading = false;
          return;
        }

        const shuffled = this.shuffleArray([...questions]);
        const selected = shuffled.slice(0, 5);
        this.questions.set(selected);
        this.loading = false;

        // Spusti časovač ak je nastavený
        if (this.timedMode && this.timeLimit > 0) {
          this.startTimer();
        }
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.error.set('Chyba pri načítavaní otázok');
        this.loading = false;
      }
    });
  }

  // Časovač
  startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
      } else {
        this.stopTimer();
        this.finishQuiz(); // Čas vypršal
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Formátovanie času MM:SS
  get formattedTime(): string {
    const m = Math.floor(this.timeRemaining / 60);
    const s = this.timeRemaining % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Farba časovača podľa zostávajúceho času
  get timerClass(): string {
    if (!this.timedMode) return '';
    const ratio = this.timeRemaining / this.timeLimit;
    if (ratio > 0.5) return 'timer-ok';
    if (ratio > 0.25) return 'timer-warning';
    return 'timer-danger';
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  toggleExplanation(): void {
    this.showExplanation = !this.showExplanation;
  }

  get progressPercentage(): number {
    const questions = this.questions();
    if (questions.length === 0) return 0;
    return (this.currentQuestion / questions.length) * 100;
  }

  get percentage(): number {
    const questions = this.questions();
    if (questions.length === 0) return 0;
    return Math.round((this.correctAnswers / questions.length) * 100);
  }

  selectAnswer(index: number): void {
    if (this.showingResult) return;
    this.selectedAnswer = index;
  }

  nextQuestion(): void {
    if (this.selectedAnswer === null) return;

    if (this.showingResult) {
      this.moveToNextQuestion();
      return;
    }

    const questions = this.questions();
    const currentQ = questions[this.currentQuestion];
    if (!currentQ) return;

    const correctAnswer = currentQ.correctAnswer ?? 0;
    const points = currentQ.points ?? 10;

    this.isCorrect = this.selectedAnswer === correctAnswer;
    this.correctAnswerIndex = correctAnswer;

    if (this.isCorrect) {
      this.score += points;
      this.correctAnswers++;
    }

    this.showingResult = true;

    if (this.isCorrect) {
      setTimeout(() => {
        this.moveToNextQuestion();
      }, 1500);
    }
  }

  private moveToNextQuestion(): void {
    const questions = this.questions();

    if (this.currentQuestion < questions.length - 1) {
      this.currentQuestion++;
      this.selectedAnswer = null;
      this.showingResult = false;
      this.isCorrect = false;
      this.correctAnswerIndex = null;
      this.showExplanation = false;
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz(): void {
    this.stopTimer();
    this.quizFinished = true;

    const questions = this.questions();
    const maxScore = questions.reduce((sum, q) => sum + (q.points ?? 10), 0);
    const topics = [...new Set(questions.map(q => q.topic))];

    this.userService.addTestResult({
      subject: this.getSubjectPrefix() + this.getCategoryName(),
      category: this.selectedCategory,
      subjectType: this.selectedSubject,
      score: this.score,
      maxScore: maxScore,
      percentage: this.percentage,
      correctAnswers: this.correctAnswers,
      totalQuestions: questions.length,
      topics: topics
    });
  }

  getAnswerClass(index: number): string {
    if (!this.showingResult) {
      return this.selectedAnswer === index ? 'selected' : '';
    }
    if (index === this.correctAnswerIndex) return 'correct';
    if (index === this.selectedAnswer && !this.isCorrect) return 'wrong';
    return '';
  }

  restartQuiz(): void {
    this.stopTimer();
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.correctAnswers = 0;
    this.quizFinished = false;
    this.showingResult = false;
    this.isCorrect = false;
    this.correctAnswerIndex = null;
    this.showExplanation = false;
    this.timeRemaining = this.timeLimit;
    this.loadQuestions();
  }
}