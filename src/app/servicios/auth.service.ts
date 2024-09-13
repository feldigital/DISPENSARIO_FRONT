import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;

  constructor(private router: Router) {}

  checkLoginStatus(): boolean {
    const loggedInStatus = sessionStorage.getItem('loggedIn');
    return loggedInStatus === 'true';
  }

  login() {
    sessionStorage.setItem('loggedIn', 'true');   
    this.isAuthenticated = true; 

  }

  logout() {
    sessionStorage.removeItem('loggedIn');
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
 
  }
/*
  login(username: string, password: string , bodega: string): boolean {
    // Aquí iría la lógica para validar las credenciales del usuario.
    // Esto podría ser una llamada a un servicio backend.
    if (username === 'admin' && password === 'admin') {
      this.isAuthenticated = true;
      return true;
    }
    return false;
  }

  logout(): void {
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }

*/
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

}