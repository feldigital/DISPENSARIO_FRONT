import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MedicamentoI } from '../modelos/medicamento.model';
import { EpsMedicamentoI } from '../modelos/epsMedicamento.model';

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {

  private urlEndPoint = environment.apiUrl+'/medicamento';
 
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


  getRegistroId(id: any): Observable<MedicamentoI> {
    const params = new HttpParams().set('id', id);
    return this.http.get<MedicamentoI>(`${this.urlEndPoint}/unico`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  public create(registro: MedicamentoI) {
    const headers = { 'Content-Type': 'application/json' };  
    return this.http.post<MedicamentoI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  public update(registro: MedicamentoI) {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.put<MedicamentoI>(`${this.urlEndPoint}`, registro).pipe(
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



  getMedicamentoBodega(idMedicamento: number, idBodega: number): Observable<any> {
    const params = new HttpParams()
    .set('idMedicamento', idMedicamento)
    .set('idBodega', idBodega);     
    return this.http.get<MedicamentoI>(`${this.urlEndPoint}/bodega`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 


  public adicionarMedicamento(registro: EpsMedicamentoI) {
    const headers = { 'Content-Type': 'application/json' };    
    return this.http.post<EpsMedicamentoI>(`${this.urlEndPoint}/eps`, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }
  
  public quitarMedicamento(idMedicamento: number,codEps: string ): Observable<void> {
    const params = new HttpParams()
    .set('idMedicamento', idMedicamento)
    .set('codEps', codEps);  
    return this.http.delete<void>(`${this.urlEndPoint}/eps`,{params}).pipe(
      catchError(e => {
        if (e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }

  agregarMedicamentoBodegatodas(idMedicamento: number): Observable<any> {
    const params = new HttpParams()
    .set('idMedicamento', idMedicamento);     
    return this.http.get<any>(`${this.urlEndPoint}/agregartbodega`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 

  agregarMedicamentoUnaBodega(idMedicamento: number, idBodega: number): Observable<any> {
    const params = new HttpParams()
    .set('idMedicamento', idMedicamento)
    .set('idBodega', idBodega);     
    return this.http.get<Boolean>(`${this.urlEndPoint}/agregarubodega`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 

  getMedicamentoContrato(idMedicamento: number): Observable<any> {
    const params = new HttpParams()
    .set('idMedicamento', idMedicamento);     
    return this.http.get<any>(`${this.urlEndPoint}/contrato`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 

  getMedicamentoContratoEps(codEps: string): Observable<any> {
    const params = new HttpParams()
    .set('codEps', codEps);     
    return this.http.get<any>(`${this.urlEndPoint}/contratoeps`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 

  getMedicamentoFiltrados(agotado: boolean,desabastecido: boolean,controlado:boolean): Observable<any> {
    const params = new HttpParams()
    .set('agotado', agotado)
    .set('desabastecido', desabastecido)
    .set('controlado', controlado);     
    return this.http.get<any>(`${this.urlEndPoint}/filtro`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 

  getMedicamentoNovigente(): Observable<any> {
    const params = new HttpParams();     
    return this.http.get<any>(`${this.urlEndPoint}/novigente`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 



}
