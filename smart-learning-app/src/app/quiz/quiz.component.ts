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
  timeRemaining = 300;
  loading = true;
  error = signal<string | null>(null);
  selectedCategory = 'kombinatorika';

  ngOnInit() {
    this.loadQuestions();
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
    this.selectedAnswer = index;
  }

  nextQuestion(): void {
    if (this.selectedAnswer === null) {
      return; // Nič nie je vybrané
    }

    const questions = this.questions();
    const currentQ = questions[this.currentQuestion];
    
    // Kontrola, či currentQ existuje
    if (!currentQ) {
      console.error('Aktuálna otázka neexistuje');
      return;
    }

    // Bezpečný prístup k correctAnswer a points
    const correctAnswer = currentQ.correctAnswer ?? 0;
    const points = currentQ.points ?? 10;

    if (this.selectedAnswer === correctAnswer) {
      this.score += points;
      this.correctAnswers++;
    }

    if (this.currentQuestion < questions.length - 1) {
      this.currentQuestion++;
      this.selectedAnswer = null;
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz(): void {
    this.quizFinished = true;
    
    const questions = this.questions();
    const maxScore = questions.reduce((sum, q) => sum + (q.points ?? 10), 0);
    
    this.userService.addTestResult({
      subject: 'Matematika - ' + this.selectedCategory,
      score: this.score,
      maxScore: maxScore,
      percentage: this.percentage
    });
  }

  restartQuiz(): void {
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.correctAnswers = 0;
    this.quizFinished = false;
    this.timeRemaining = 300;
    this.loadQuestions();
  }
}