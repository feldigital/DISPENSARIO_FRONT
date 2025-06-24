import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { PacienteI } from '../modelos/paciente.model';


@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  private urlEndPoint = environment.apiUrl+'/paciente';
 
  constructor(private http: HttpClient) { }

 
  getRegistros(): Observable<any> {
    return this.http.get(this.urlEndPoint).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }
  getRegistrosActivos(): Observable<any> { 
    return this.http.get(`${this.urlEndPoint}/activos`).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }
  getRegistrosInactivos(): Observable<any> { 
    return this.http.get(`${this.urlEndPoint}/inactivos`).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }


  getRegistroId(id: any): Observable<PacienteI> {
    const params = new HttpParams().set('id', id);
    return this.http.get<PacienteI>(`${this.urlEndPoint}/unico`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 


  getRegistroDocumento(id: any): Observable<any> {
    const params = new HttpParams().set('documento', id);
    return this.http.get<any>(`${this.urlEndPoint}/documento`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  public create(registro: PacienteI) {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<PacienteI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  public update(registro: PacienteI) {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.put<PacienteI>(`${this.urlEndPoint}`, registro).pipe(
      catchError(e => {
        if (e.status == 400) {
          return throwError(e);
        }
        if (e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }

  public delete(id: any): Observable<void> {
    const params = new HttpParams().set('id', id);
    return this.http.delete<void>(`${this.urlEndPoint}`,{params}).pipe(
      catchError(e => {
        if (e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }


  filtrarPacientes(pNombre: string, sNombre: string, pApellido: string,sApellido: string): Observable<PacienteI[]> {
    const params = new HttpParams()
    .set('pNombre', pNombre)
    .set('sNombre', sNombre)
    .set('pApellido', pApellido)
    .set('sApellido', sApellido);
    return this.http.get<PacienteI[]>(`${this.urlEndPoint}/filtrar`, {params}).pipe(
      catchError(this.handleError<PacienteI[]>('filtrarPacientes', []))
    );
  }
  
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
  getEps(): Observable<any> { 
    return this.http.get(`${this.urlEndPoint}/eps`).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  getCategoria(): Observable<any> { 
    return this.http.get(`${this.urlEndPoint}/categoria`).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  getTipoDocumento(): Observable<any> { 
    return this.http.get(`${this.urlEndPoint}/tipo-documento`).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  public exportarPacientes(registro: any): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<any>(`${this.urlEndPoint}/exportar`, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  public importarPacientes(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.urlEndPoint}/importar`, formData);
  }
 
  public insertarNuevosPacientes() {
    return this.http.post(`${this.urlEndPoint}/insertar-nuevos`, null);
  }

  public actualizarPacienteTemporal(registro: any): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<any>(`${this.urlEndPoint}/actualizar-temporal`, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

}