import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {

  private permisosSubject = new BehaviorSubject<string[]>([]);
  permisos$ = this.permisosSubject.asObservable(); // Observable para permisos

  constructor(private http: HttpClient) {}

  // Método para cargar permisos desde el backend
  cargarPermisos(): void {
    this.http.get<string[]>('/api/permisos').subscribe(
      (permisos) => this.permisosSubject.next(permisos),
      (error) => {
        console.error('Error al cargar permisos:', error);
        this.permisosSubject.next([]); // En caso de error, sin permisos
      }
    );
  }

  // Verificar si un permiso está presente
  tienePermiso(rol: string): boolean {
    return this.permisosSubject.value.includes(rol);
  }
}