import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { FirebaseService, Question } from '../services/firebase.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css'
})
export class QuizComponent implements OnInit {
  private userService = inject(UserService);
  private firebaseService = inject(FirebaseService);

  questions = signal<Question[]>([]);
  currentQuestion = 0;
  selectedAnswer: number | null = null;
  score = 0;
  correctAnswers = 0;
  quizFinished = false;
  quizStarted = false; // NOVÉ
  timeRemaining = 300;
  loading = false;
  error = signal<string | null>(null);
  selectedCategory = '';
  
  showingResult = false;
  isCorrect = false;
  correctAnswerIndex: number | null = null;

  ngOnInit() {
    // Nespúšťame automaticky, čakáme na výber kategórie
  }

  // NOVÉ: Výber kategórie
  selectCategory(category: string) {
    this.selectedCategory = category;
    this.quizStarted = true;
    this.loadQuestions();
  }

  // NOVÉ: Späť na výber kategórií
  backToCategories() {
    this.quizStarted = false;
    this.quizFinished = false;
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.correctAnswers = 0;
    this.showingResult = false;
    this.questions.set([]);
  }

  // NOVÉ: Meno kategórie
  getCategoryName(): string {
    const names: { [key: string]: string } = {
      'kombinatorika': 'Kombinatorika',
      'pravdepodobnost': 'Pravdepodobnosť',
      'statistika': 'Štatistika',
      'postupnosti': 'Postupnosti'
    };
    return names[this.selectedCategory] || 'Test';
  }

  loadQuestions() {
    this.loading = true;
    this.error.set(null);
    
    this.firebaseService.getQuestions(this.selectedCategory).subscribe({
      next: (questions) => {
        console.log('Načítané otázky:', questions);
        
        if (questions.length === 0) {
          this.error.set('Žiadne otázky pre túto kategóriu');
        }
        
        this.questions.set(questions);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.error.set('Chyba pri načítavaní otázok: ' + error.message);
        this.loading = false;
      }
    });
  }

  get currentQ(): Question | undefined {
    const questions = this.questions();
    return questions.length > 0 ? questions[this.currentQuestion] : undefined;
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
    if (this.selectedAnswer === null) {
      return;
    }

    if (this.showingResult) {
      this.moveToNextQuestion();
      return;
    }

    const questions = this.questions();
    const currentQ = questions[this.currentQuestion];
    
    if (!currentQ) {
      console.error('Aktuálna otázka neexistuje');
      return;
    }

    const correctAnswer = currentQ.correctAnswer ?? 0;
    const points = currentQ.points ?? 10;

    this.isCorrect = this.selectedAnswer === correctAnswer;
    this.correctAnswerIndex = correctAnswer;
    
    if (this.isCorrect) {
      this.score += points;
      this.correctAnswers++;
    }

    this.showingResult = true;

    setTimeout(() => {
      this.moveToNextQuestion();
    }, 1500);
  }

  private moveToNextQuestion(): void {
    const questions = this.questions();
    
    if (this.currentQuestion < questions.length - 1) {
      this.currentQuestion++;
      this.selectedAnswer = null;
      this.showingResult = false;
      this.isCorrect = false;
      this.correctAnswerIndex = null;
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz(): void {
    this.quizFinished = true;
    
    const questions = this.questions();
    const maxScore = questions.reduce((sum, q) => sum + (q.points ?? 10), 0);
    const topics = [...new Set(questions.map(q => q.topic))];
    
    this.userService.addTestResult({
      subject: 'Matematika - ' + this.getCategoryName(),
      category: this.selectedCategory,
      score: this.score,
      maxScore: maxScore,
      percentage: this.percentage,
      correctAnswers: this.correctAnswers,
      totalQuestions: questions.length,
      topics: topics
    });

    console.log('✅ Test dokončený:', {
      percentage: this.percentage,
      correctAnswers: this.correctAnswers,
      totalQuestions: questions.length
    });
  }

  getAnswerClass(index: number): string {
    if (!this.showingResult) {
      return this.selectedAnswer === index ? 'selected' : '';
    }
    
    if (index === this.correctAnswerIndex) {
      return 'correct';
    }
    
    if (index === this.selectedAnswer && !this.isCorrect) {
      return 'wrong';
    }
    
    return '';
  }

  restartQuiz(): void {
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.correctAnswers = 0;
    this.quizFinished = false;
    this.timeRemaining = 300;
    this.showingResult = false;
    this.isCorrect = false;
    this.correctAnswerIndex = null;
    this.loadQuestions();
  }
}