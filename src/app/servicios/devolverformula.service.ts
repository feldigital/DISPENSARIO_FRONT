import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { FormulaDevolucionI } from '../modelos/formuladevolucion.model';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DevolverformulaService {

   private urlEndPoint = environment.apiUrl + '/devolverformula';
    constructor(private http: HttpClient) { }


    
  getDevolucionFormulaId(id: number): Observable<any> {
    const params = new HttpParams()
      .set('id', id);
    return this.http.get<any>(`${this.urlEndPoint}/unica`, { params });
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams()
      .set('id', id);
    return this.http.delete<void>(`${this.urlEndPoint}`, { params });
  }



  createDevolucion(registro: FormulaDevolucionI): Observable<FormulaDevolucionI> {
    const headers = { 'Content-Type': 'application/json' };
    //console.log(JSON.stringify(registro));   
    return this.http.post<FormulaDevolucionI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  update(registro: FormulaDevolucionI): Observable<FormulaDevolucionI> {
    const headers = { 'Content-Type': 'application/json' };
    //console.log(JSON.stringify(registro));
    return this.http.put<FormulaDevolucionI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

}
