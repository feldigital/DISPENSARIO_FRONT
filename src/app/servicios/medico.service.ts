import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { MedicoI } from '../modelos/medico.model';

@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  private urlEndPoint = environment.apiUrl+'/medico';
 
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


  getRegistroId(id: any): Observable<MedicoI> {
    const params = new HttpParams().set('id', id);
    return this.http.get<MedicoI>(`${this.urlEndPoint}/unico`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  public create(registro: MedicoI) {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<MedicoI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  public update(registro: MedicoI) {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.put<MedicoI>(`${this.urlEndPoint}`, registro).pipe(
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



  filtrarMedicos(term: string): Observable<MedicoI[]> {  
    const params = new HttpParams()
    .set('term', term);
    return this.http.get<MedicoI[]>(`${this.urlEndPoint}/filtrar`, {params}).pipe(
      catchError(this.handleError<MedicoI[]>('filtrarMedicos', []))
    );
  }


  buscarMedicosRegistro(term: string): Observable <MedicoI[]> {   
    const params = new HttpParams()
    .set('term', term);
    return this.http.get<MedicoI[]>(`${this.urlEndPoint}/registro`, {params}).pipe(
      catchError(this.handleError<MedicoI[]>('RegistrosMedicos', []))
    );
  }

  
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

}
