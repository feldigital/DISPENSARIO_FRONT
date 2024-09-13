import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ViaI } from '../modelos/via.model';

@Injectable({
  providedIn: 'root'
})
export class ViaService {

 
  private urlEndPoint = environment.apiUrl+'/via_administracion';
 
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


  getRegistroId(id: any): Observable<ViaI> {
    const params = new HttpParams().set('id', id);
    return this.http.get<ViaI>(`${this.urlEndPoint}/unico`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  public create(registro: ViaI) {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<ViaI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  public update(registro: ViaI) {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.put<ViaI>(`${this.urlEndPoint}`, registro).pipe(
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


  filtrarVia(term: string): Observable<ViaI[]> {
    const encodedTerm = encodeURIComponent(term);
    const params = new HttpParams()
    .set('term', encodedTerm);
    return this.http.get<ViaI[]>(`${this.urlEndPoint}/filtrar`, {params}).pipe(
      catchError(this.handleError<ViaI[]>('filtrarIpss', []))
    );
  }
  
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }


}