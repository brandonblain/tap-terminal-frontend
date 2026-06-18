import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private getHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json'
    });
  }

  // 1. Obtener todos los perfiles
  getProfiles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/profiles`, { headers: this.getHeaders() });
  }

  // 2. Dar de alta un perfil
  createProfile(profile: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/profiles`, profile, { headers: this.getHeaders() });
  }

  // 3. Modificar un perfil
  updateProfile(id: string, profile: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profiles/${id}`, profile, { headers: this.getHeaders() });
  }

  // 4. Eliminar un perfil
  deleteProfile(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/profiles/${id}`, { headers: this.getHeaders() });
  }
}