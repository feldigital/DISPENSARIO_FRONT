import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {


  
   private urlEndPoint = environment.apiUrl+'/dashboard';
   
  constructor(private http: HttpClient) {}

  obtenerEstadisticasFormula(idBodega: number, fInicial: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlEndPoint}/formula`, {
      params: {
        idBodega: idBodega,
        fInicialstr: fInicial
          }
    });
  }

  getEstadisticaCrea(idBodega: number, fInicial: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlEndPoint}/creaformula`, {
      params: {
        idBodega: idBodega,
        fInicialstr: fInicial
      }
    });
}

getEstadisticaFormulasUltimosMeses(idBodega: number, fInicial: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlEndPoint}/formulames`, {
      params: {
        idBodega: idBodega,
        fInicialstr: fInicial
      }
    });
}

getEstadisticaTopMedicamentos(idBodega: number, fInicial: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlEndPoint}/topmedicamentos`, {
      params: {
        idBodega: idBodega,
        fInicialstr: fInicial
      }
    });
}

getEstadisticaEstadoOrden(idBodega: number, fInicial: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlEndPoint}/ordenestado`, {
      params: {
        idBodega: idBodega,
        fInicialstr: fInicial
      }
    });
}

getEstadisticaTopMedicamentosPendiente(idBodega: number, fInicial: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlEndPoint}/topmedicamentospendientes`, {
      params: {
        idBodega: idBodega,
        fInicialstr: fInicial
      }
    });
}

getEstadisticaVencimientos(idBodega: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlEndPoint}/vencidosmes`, {
      params: {
        idBodega: idBodega
      }
    });
}

getEstadisticaFormulasIncompletasMeses(idBodega: number, fInicial: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlEndPoint}/formulasincompletasmes`, {
      params: {
        idBodega: idBodega,
        fInicialstr: fInicial
      }
    });
}


getEstadisticaFormulasUltimosMesesNoReclamadas(idBodega: number, fInicial: string): Observable<any[]> {
  
    return this.http.get<any[]>(`${this.urlEndPoint}/formulasnoreclamadas`, {
      params: {
        idBodega: idBodega,
        fInicialstr: fInicial
      }
    });
}

 obtenerEstadisticasGenerales(idBodega: number, fInicial: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlEndPoint}/estadisticagenerales`, {
      params: {
        idBodega: idBodega,
        fInicialstr: fInicial
          }
    });
  }

}