import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ProveedorI } from '../modelos/proveedor.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  private urlEndPoint = environment.apiUrl+'/proveedor';
   
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
  
  
    getRegistroId(id: any): Observable<ProveedorI> {
      const params = new HttpParams().set('id', id);
      return this.http.get<ProveedorI>(`${this.urlEndPoint}/unico`,{params}).pipe(
        catchError(e => {
          if (e.status != 401 && e.error.mensaje) {        
            console.error(e.error.mensaje);
          }
  
          return throwError(e);
        }));
    } 
  
    public create(registro: ProveedorI) {
      const headers = { 'Content-Type': 'application/json' };   
      return this.http.post<ProveedorI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
        catchError(e => {
          return throwError(e);
        })
      );
    }
  
    public update(registro: ProveedorI) {
      const headers = { 'Content-Type': 'application/json' };
      return this.http.put<ProveedorI>(`${this.urlEndPoint}`, registro).pipe(
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
  
  
  
    filtrarProveedores(term: string): Observable<ProveedorI[]> {  
      const params = new HttpParams()
      .set('term', term);
      return this.http.get<ProveedorI[]>(`${this.urlEndPoint}/filtrar`, {params}).pipe(
        catchError(this.handleError<ProveedorI[]>('filtrarProveedores', []))
      );
    }
  
  
    buscarProveedorNit(term: string): Observable <ProveedorI[]> {   
      const params = new HttpParams()
      .set('term', term);
      return this.http.get<ProveedorI[]>(`${this.urlEndPoint}/nit`, {params}).pipe(
        catchError(this.handleError<ProveedorI[]>('NitProveedores', []))
      );
    }
  
    
    private handleError<T>(operation = 'operation', result?: T) {
      return (error: any): Observable<T> => {
        console.error(`${operation} failed: ${error.message}`);
        return of(result as T);
      };
    }
  
  }
  