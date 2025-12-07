import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  addTestResult(arg0: { subject: string; score: number; maxScore: number; percentage: number; }) {
    throw new Error('Method not implemented.');
  }

  constructor() { }
}
