import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Question {
  question: string;
  answers: string[];
  correctAnswer: number;
  topic: string;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css'
})
export class QuizComponent {
  questions: Question[] = [
    {
      question: 'Koľko je 2 + 2?',
      answers: ['3', '4', '5', '6'],
      correctAnswer: 1,
      topic: 'základné operácie'
    },
    {
      question: 'Čo je výsledok 5 × 3?',
      answers: ['10', '12', '15', '18'],
      correctAnswer: 2,
      topic: 'násobenie'
    },
    {
      question: 'Koľko je 10 - 7?',
      answers: ['2', '3', '4', '5'],
      correctAnswer: 1,
      topic: 'odčítanie'
    },
    {
      question: 'Čo je výsledok 12 ÷ 4?',
      answers: ['2', '3', '4', '6'],
      correctAnswer: 1,
      topic: 'delenie'
    },
    {
      question: 'Koľko je 8 + 7?',
      answers: ['14', '15', '16', '17'],
      correctAnswer: 1,
      topic: 'sčítanie'
    }
  ];

  currentQuestion = 0;
  selectedAnswer: number | null = null;
  score = 0;
  correctAnswers = 0;
  quizFinished = false;
  timeRemaining = 300; // 5 minút

  get progressPercentage(): number {
    return (this.currentQuestion / this.questions.length) * 100;
  }

  get percentage(): number {
    return Math.round((this.correctAnswers / this.questions.length) * 100);
  }

  selectAnswer(index: number): void {
    this.selectedAnswer = index;
  }

  nextQuestion(): void {
    if (this.selectedAnswer !== null) {
      // Skontroluj odpoveď
      if (this.selectedAnswer === this.questions[this.currentQuestion].correctAnswer) {
        this.score += 10;
        this.correctAnswers++;
      }

      // Ďalšia otázka alebo koniec
      if (this.currentQuestion < this.questions.length - 1) {
        this.currentQuestion++;
        this.selectedAnswer = null;
      } else {
        this.quizFinished = true;
      }
    }
  }

  restartQuiz(): void {
    this.currentQuestion = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.correctAnswers = 0;
    this.quizFinished = false;
    this.timeRemaining = 300;
  }
}