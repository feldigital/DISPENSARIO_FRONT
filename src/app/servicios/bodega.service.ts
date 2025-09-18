import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { throwError } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BodegaI } from '../modelos/bodega.model';

@Injectable({
  providedIn: 'root'
})
export class BodegaService {

  private urlEndPoint = environment.apiUrl+'/bodega'; 
  
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


  getRegistroId(id: any): Observable<BodegaI> {
    const params = new HttpParams().set('id', id);
    return this.http.get<BodegaI>(`${this.urlEndPoint}/unico`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 
  
  getMunicipiosDepartamento(id: any): Observable<any> {
    const params = new HttpParams().set('id', id);
    return this.http.get<any>(`${this.urlEndPoint}/municipio`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 
  getDepartamentos(): Observable<any> {
    return this.http.get<any>(`${this.urlEndPoint}/departamento`).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 


  public create(registro: BodegaI) {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<BodegaI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  public update(registro: BodegaI) {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.put<BodegaI>(`${this.urlEndPoint}`, registro).pipe(
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

  getRegistrosMedicamentoBodega(id: number): Observable<any> {
    const params = new HttpParams().set('idBodega', id);
    return this.http.get(`${this.urlEndPoint}/medicamento`,{params}).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  
  getRegistroMedicamentoBodegaId(id: number): Observable<any> {
    const params = new HttpParams().set('id', id);
    return this.http.get<any>(`${this.urlEndPoint}/medicamento/unico`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 


  public createMedicamentoBodega(registro: any) {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<any>(`${this.urlEndPoint}/medicamento`, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  public updateMedicamentoBodega(registro: any) {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.put<any>(`${this.urlEndPoint}/medicamento`, registro).pipe(
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

  public deleteMedicamentoBodegaId(id: any): Observable<void> {
    const params = new HttpParams().set('id', id);
    return this.http.delete<void>(`${this.urlEndPoint}/medicamento`,{params}).pipe(
      catchError(e => {
        if (e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }

  getMedicamentosBodegaPendiente(id: number,fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', id)
    .set('fInicial', fInicial)
    .set('fFinal', fFinal);

    return this.http.get<any>(`${this.urlEndPoint}/medicamento/pendiente`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  getMedicamentosBodegaOrdenDespacho(bodegaOrigen: number,bodegaDestino: number): Observable<any> {
    const params = new HttpParams()
    .set('bodegaOrigen', bodegaOrigen)
    .set('bodegaDestino', bodegaDestino);
    return this.http.get<any>(`${this.urlEndPoint}/despacho`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 


  getMedicamentosBodegaEntregados(id: number,fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', id)
    .set('fInicial', fInicial)
    .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/entrega`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  

  getMedicamentosBodegaEntregaDetallada(id: number,fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', id)
    .set('fInicial', fInicial)
    .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/entrega/detallada`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }


  getMedicamentosBodegaEntregaDetalladaConsolidada(id: number,fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', id)
    .set('fInicial', fInicial)
    .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/entrega/detalladaconsolidada`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }

  getMedicamentosBodegaEntregaDetalladaConsolidadaPqrs(id: number,fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', id)
    .set('fInicial', fInicial)
    .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/entrega/detalladaconsolidadapqrs`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }

  getMedicamentosPendienteDetallada(id: number,fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', id)
    .set('fInicial', fInicial)
    .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/entrega/pendiente`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 

  

  getMedicamentosBodegaEntregadosMeses(id: number,fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', id)
    .set('fInicial', fInicial)
    .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/entregameses`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  }

  getPacientePendiente(id: number,fInicial: string, fFinal: string,idMedicamento: number): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', id)
    .set('fInicial', fInicial)
    .set('fFinal', fFinal)
    .set('idMedicamento', idMedicamento);

    return this.http.get<any>(`${this.urlEndPoint}/paciente/pendiente`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  getExistenciasMedicamentos(term: string): Observable<any> {
    const params = new HttpParams()
    .set('term', term);

    return this.http.get<any>(`${this.urlEndPoint}/existencias`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  } 

  getExistenciasMedicamentoPuntual(idMedicamento: number): Observable<any> {
    const params = new HttpParams()
    .set('idMedicamento', idMedicamento);
    return this.http.get<any>(`${this.urlEndPoint}/existenciaspuntual`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 

  getMedicamentosVencidos(idBodega: number,fInicial: string): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', idBodega)
    .set('fInicial', fInicial);
    return this.http.get<any>(`${this.urlEndPoint}/vencidos`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 

  getMedicamentosNorotan(idBodega: number,fInicial: string): Observable<any> {
    const params = new HttpParams()
    .set('idBodega', idBodega)
    .set('fInicial', fInicial);
    return this.http.get<any>(`${this.urlEndPoint}/norotan`,{params}).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {        
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  } 

  public obtenerMedicamentoPrescritosEntrega(registro: any): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<any>(`${this.urlEndPoint}/prescripciones-entregas`, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  public obtenerMedicamentoPrescritosEntregaPorBodega(registro: any): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<any>(`${this.urlEndPoint}/prescripciones-entregas-bodegas`, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

    public obtenerFormulasByDx(registro: any): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<any>(`${this.urlEndPoint}/prescripciones-diagnosticos`, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }


}
