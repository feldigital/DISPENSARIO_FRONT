import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, throwError } from 'rxjs';
import { OrdenDespachoI } from '../modelos/ordendespacho.model';
import { MedicamentoI } from '../modelos/medicamento.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdendespachoService {

  private urlEndPoint = environment.apiUrl+'/despacho';
  

  constructor(private http: HttpClient) { }

  
  getOrdenDespachoId(id: number): Observable<any> {
    const params = new HttpParams()
    .set('id', id);
    return this.http.get<any>(`${this.urlEndPoint}/unica`, {params});
  }



  getOrdenDespachoBodegaOrigen( idBodega: number): Observable<any> {
    const params = new HttpParams()
    .set('idBodegaOrigen', idBodega);     
    return this.http.get<OrdenDespachoI>(`${this.urlEndPoint}/bodegaorigen`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 
  getOrdenDespachoBodegaDestino( idBodega: number): Observable<any> {
    const params = new HttpParams()
    .set('idBodegaDestino', idBodega);     
    return this.http.get<OrdenDespachoI>(`${this.urlEndPoint}/bodegadestino`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  getOrdenDespachoBodegaTodas( idBodega: number): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', idBodega);     
    return this.http.get<OrdenDespachoI>(`${this.urlEndPoint}/bodega`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  delete(id: number): Observable<void> {
    const params = new HttpParams()
    .set('id', id);
    return this.http.delete<void>(`${this.urlEndPoint}`, {params});
  }

  

  create(registro: OrdenDespachoI): Observable<OrdenDespachoI> {
    const headers = { 'Content-Type': 'application/json' };   
    //console.log(JSON.stringify(registro));
    console.log(registro);
    return this.http.post<OrdenDespachoI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
}


public update(registro: OrdenDespachoI) {
  const headers = { 'Content-Type': 'application/json' };
  return this.http.put<OrdenDespachoI>(`${this.urlEndPoint}`, registro).pipe(
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




saveEntregaFormula(idFormula: number,idBodega: number, funcionario: string , medioEntrega: string) {
 // const headers = { 'Content-Type': 'application/json' };   
  const params = new HttpParams()
  .set('idFormula', idFormula)
  .set('idBodega', idBodega)
  .set('funcionario', funcionario)
  .set('medioEntrega', medioEntrega) ;
  return this.http.get<any>(`${this.urlEndPoint}/entrega`, {params}).pipe(
  catchError(e => {
    return throwError(e);
  })
);
}


saveItemEntregaFormula(idItem: number,idBodega: number, funcionario: string, medioEntrega: string, cantidadAentregar:number) {
  // const headers = { 'Content-Type': 'application/json' };   
   const params = new HttpParams()
   .set('idItem', idItem)
   .set('idBodega', idBodega)
   .set('funcionario', funcionario)
   .set('medioEntrega', medioEntrega)
   .set('cantidadAentregar', cantidadAentregar);
    
   return this.http.get<any>(`${this.urlEndPoint}/entrega/pendiente`, {params}).pipe(
   catchError(e => {
     return throwError(e);
   })
 );
 }

 descargarinventarioBodegacange(idDespacho: number, idBodega: number, funcionario: string) {
  const params = new HttpParams()
  .set('idDespacho', idDespacho)
  .set('idBodega', idBodega)
  .set('funcionario', funcionario);     
  return this.http.get<any>(`${this.urlEndPoint}/bodegacange`,{params}).pipe(
    catchError(e => {
      if (e.status != 401 && e.error.mensaje) {        
        console.error(e.error.mensaje);
      }

      return throwError(e);
    }));
} 

cargarinventariocangeBodega(idDespacho: number, idBodega: number, funcionario: string) {
  const params = new HttpParams()
  .set('idDespacho', idDespacho)
  .set('idBodega', idBodega)
  .set('funcionario', funcionario);     
  return this.http.get<any>(`${this.urlEndPoint}/cangebodega`,{params}).pipe(
    catchError(e => {
      if (e.status != 401 && e.error.mensaje) {        
        console.error(e.error.mensaje);
      }

      return throwError(e);
    }));
} 


}
