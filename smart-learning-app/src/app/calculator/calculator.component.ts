import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css'
})
export class CalculatorComponent {
  display = signal<string>('0');
  previousValue = '';
  operator = '';
  waitingForOperand = false;

  inputDigit(digit: string) {
    if (this.waitingForOperand) {
      this.display.set(digit);
      this.waitingForOperand = false;
    } else {
      const current = this.display();
      this.display.set(current === '0' ? digit : current + digit);
    }
  }

  inputDecimal() {
    if (this.waitingForOperand) {
      this.display.set('0.');
      this.waitingForOperand = false;
      return;
    }

    if (!this.display().includes('.')) {
      this.display.set(this.display() + '.');
    }
  }

  clear() {
    this.display.set('0');
    this.previousValue = '';
    this.operator = '';
    this.waitingForOperand = false;
  }

  performOperation(nextOperator: string) {
    const inputValue = parseFloat(this.display());

    if (this.previousValue === '') {
      this.previousValue = String(inputValue);
    } else if (this.operator) {
      const currentValue = parseFloat(this.previousValue);
      const result = this.calculate(currentValue, inputValue, this.operator);
      
      this.display.set(String(result));
      this.previousValue = String(result);
    }

    this.waitingForOperand = true;
    this.operator = nextOperator;
  }

  calculate(firstOperand: number, secondOperand: number, operator: string): number {
    switch (operator) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '×':
        return firstOperand * secondOperand;
      case '÷':
        return secondOperand !== 0 ? firstOperand / secondOperand : 0;
      case '^':
        return Math.pow(firstOperand, secondOperand);
      default:
        return secondOperand;
    }
  }

  equals() {
    const inputValue = parseFloat(this.display());

    if (this.operator && this.previousValue !== '') {
      const currentValue = parseFloat(this.previousValue);
      const result = this.calculate(currentValue, inputValue, this.operator);
      
      this.display.set(String(result));
      this.previousValue = '';
      this.operator = '';
      this.waitingForOperand = true;
    }
  }

  factorial() {
    const n = Math.floor(parseFloat(this.display()));
    if (n < 0) {
      this.display.set('Error');
      return;
    }
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    this.display.set(String(result));
    this.waitingForOperand = true;
  }

  sqrt() {
    const value = parseFloat(this.display());
    this.display.set(String(Math.sqrt(value)));
    this.waitingForOperand = true;
  }

  backspace() {
    const current = this.display();
    if (current.length > 1) {
      this.display.set(current.slice(0, -1));
    } else {
      this.display.set('0');
    }
  }
}