import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Login con guardado del token en localstorage
  login(credentials: { user: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.access_token) {
          localStorage.setItem('token', response.access_token);
          localStorage.setItem('user_code', response.user?.code || '');
        }
      })
    );
  }

  // Cierra la Sesión (Destruye el token)
  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        localStorage.clear();
      })
    );
  }

  recoverPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recover-password`, { email });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasPermission(requiredSection: string): boolean {
  const userData = localStorage.getItem('user_session');
  if (!userData) return false;

  const user = JSON.parse(userData);

  // 1. Sincronizado con tu JSON: Cambiamos 'profile_codes' por 'profiles'
  if (user.profiles?.includes('SUPER_ADMIN')) {
    return true; // El admin tiene pase directo total
  }

  // 2. Compara si la sección de la ruta (ej. 'USUARIOS') existe en sus sections ['PRODUCTOS']
  return user.sections?.includes(requiredSection) || false;
}
}