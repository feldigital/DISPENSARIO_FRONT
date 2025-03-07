import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {  Observable, catchError, of, throwError } from 'rxjs';
import { AjusteInventarioI } from '../modelos/ajusteinventario.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AjusteinventarioService {

  private urlEndPoint = environment.apiUrl+'/ajusteinventario';  
 
   constructor(private http: HttpClient) { }
   
   getAjusteInventarioId(id: number): Observable<any> {
     const params = new HttpParams()
     .set('id', id);
     return this.http.get<any>(`${this.urlEndPoint}/unica`, {params});
   }
 
   getAjusteInventarioBodega( idBodega: number,fInicial: string, fFinal: string): Observable<any> {
     const params = new HttpParams()
     .set('idBodega', idBodega)
     .set('fInicial', fInicial)
     .set('fFinal', fFinal);     
     return this.http.get<AjusteInventarioI>(`${this.urlEndPoint}/bodega`,{params}).pipe(
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
 
   deleteItem(id: number): Observable<void> {
     const params = new HttpParams()
     .set('id', id);
     return this.http.delete<void>(`${this.urlEndPoint}/item`, {params});
   }
   
 
   create(registro: AjusteInventarioI): Observable<AjusteInventarioI> {
     const headers = { 'Content-Type': 'application/json' };    
     return this.http.post<AjusteInventarioI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
       catchError(e => {
         return throwError(e);
       })
     );
 }
 
 
 public update(registro: AjusteInventarioI) {
   const headers = { 'Content-Type': 'application/json' };
   return this.http.put<AjusteInventarioI>(`${this.urlEndPoint}`, registro).pipe(
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
 
  
  ajustarInventarioBodega(idAjuste: number, idBodega: number, funcionario: string) {
   const params = new HttpParams()
   .set('idAjuste', idAjuste)
   .set('idBodega', idBodega)
   .set('funcionario', funcionario);     
   return this.http.get<any>(`${this.urlEndPoint}/ajustar`,{params}).pipe(
     catchError(e => {
       if (e.status != 401 && e.error.mensaje) {        
         console.error(e.error.mensaje);
       }
 
       return throwError(e);
     }));
 } 
 
 /*
 
 getDetalleOrdenDespacho( idBodega: number,fInicial: string, fFinal: string, tipoReporte: number): Observable<any> {
   const params = new HttpParams()
   .set('idBodega', idBodega)
   .set('fInicial', fInicial)
   .set('fFinal', fFinal)
   .set('tipoReporte', tipoReporte);     
   return this.http.get<OrdenDespachoI>(`${this.urlEndPoint}/detallesalida`,{params}).pipe(
     catchError(e => {
       if (e.status != 401 && e.error.mensaje) {        
         console.error(e.error.mensaje);
       }
 
       return throwError(e);
     }));
 } 
 
 
 getMedicamentoOrdenDespacho( idMedicamento: number,idBodega: number,fInicial: string, fFinal: string): Observable<any> {
   const params = new HttpParams()
   .set('idMedicamento', idMedicamento)
   .set('idBodega', idBodega)
   .set('fInicial', fInicial)
   .set('fFinal', fFinal);     
   return this.http.get<any>(`${this.urlEndPoint}/medicamento`,{params}).pipe(
     catchError(e => {
       if (e.status != 401 && e.error.mensaje) {        
         console.error(e.error.mensaje);
       }
 
       return throwError(e);
     }));
 } 
 */
 
 }
 