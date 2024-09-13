import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DptoMunService {
  private urlEndPoint = environment.apiUrl+'/departamento'; 
  constructor(private http: HttpClient) { }

 
  getDepartamento(): Observable<any> {
    return this.http.get(this.urlEndPoint).pipe(     
      catchError(e => {
        console.log("Error al traer la lista de departamento de la base de dato",e);
        return throwError(e);
      })
    );
  }
  getMunicipiodpto(dpto: number): Observable<any> { 
    const params = new HttpParams().set('id', dpto);
    return this.http.get(`${this.urlEndPoint}/municipios`,{params}).pipe(
     
      catchError(e => {
        console.log("Error al traer la lista de municipios de la base de dato",e);
        return throwError(e);
      })
    );
  }
}
