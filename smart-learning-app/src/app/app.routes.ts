import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QuizComponent } from './quiz/quiz.component';
import { MaterialsComponent } from './materials/materials.component';
import { ProgressComponent } from './progress/progress.component';
import { ProfileComponent } from './profile/profile.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'quiz', component: QuizComponent },
  { path: 'materials', component: MaterialsComponent },
  { path: 'progress', component: ProgressComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '**', redirectTo: '' }
];