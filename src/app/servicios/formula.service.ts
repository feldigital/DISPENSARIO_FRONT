import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, throwError } from 'rxjs';
import { FormulaI } from '../modelos/formula.model';
import { MedicamentoI } from '../modelos/medicamento.model';
import { environment } from 'src/environments/environment';
import { HistorialMensajeI } from '../modelos/historialMensaje';
import { EpsMedicamentoI } from '../modelos/epsMedicamento.model';

@Injectable({
  providedIn: 'root'
})
export class FormulaService {


  private urlEndPoint = environment.apiUrl + '/formula';
  constructor(private http: HttpClient) { }



  getFormulaId(id: number): Observable<any> {
    const params = new HttpParams()
      .set('id', id);
    return this.http.get<any>(`${this.urlEndPoint}/unica`, { params });
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams()
      .set('id', id);
    return this.http.delete<void>(`${this.urlEndPoint}`, { params });
  }



  create(registro: FormulaI): Observable<FormulaI> {
    const headers = { 'Content-Type': 'application/json' };
    //console.log(JSON.stringify(registro));   
    return this.http.post<FormulaI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  update(registro: FormulaI): Observable<FormulaI> {
    const headers = { 'Content-Type': 'application/json' };
    //console.log(JSON.stringify(registro));
    return this.http.put<FormulaI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  getItemFormula(idItem: number): Observable<any> {
    const params = new HttpParams()
      .set('idItem', idItem);
    return this.http.get<any>(`${this.urlEndPoint}/item`, { params });
  }

  guardarMensaje(registro: HistorialMensajeI): Observable<HistorialMensajeI> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post<HistorialMensajeI>(`${this.urlEndPoint}/item_mensaje`, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }


  filtrarMedicamentos(term: string): Observable<MedicamentoI[]> {
    //const encodedTerm = encodeURIComponent(term);
    const params = new HttpParams()
      .set('term', term);
    return this.http.get<MedicamentoI[]>(`${this.urlEndPoint}/filtrar-medicamento`, { params }).pipe(
      catchError(this.handleError<MedicamentoI[]>('filtrarMedicamentos', []))
    );
  }


  filtrarMedicamentosEps(term: string, codEps: string): Observable<MedicamentoI[]> {
    //const encodedTerm = encodeURIComponent(term);
    const params = new HttpParams()
      .set('term', term)
      .set('codEps', codEps);
    return this.http.get<MedicamentoI[]>(`${this.urlEndPoint}/filtrar-medicamento-eps`, { params }).pipe(
      catchError(this.handleError<MedicamentoI[]>('filtrarMedicamentos', []))
    );
  }




  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  saveEntregaFormula(idFormula: number, idBodega: number, funcionario: string, medioEntrega: string, tipoRecibe: string, documentoRecibe: string) {
    // const headers = { 'Content-Type': 'application/json' }; 
    const fechaEntrega = new Date();
    const fechaEntregaISO = fechaEntrega.toISOString();
    const params = new HttpParams()
      .set('idFormula', idFormula)
      .set('idBodega', idBodega)
      .set('funcionario', funcionario)
      .set('medioEntrega', medioEntrega)
      .set('fechaEntrega', fechaEntregaISO)
      .set('tipoRecibe', tipoRecibe)
      .set('documentoRecibe', documentoRecibe);

    return this.http.get<any>(`${this.urlEndPoint}/entrega`, { params }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }


  saveItemEntregaFormula(idItem: number, idBodega: number, funcionario: string, medioEntrega: string, cantidadAentregar: number, tipoRecibe: string, documentoRecibe: string, fechaEntrega: string, idBodegaFormula: number) {
    // const headers = { 'Content-Type': 'application/json' };   
    const now = new Date();   
    const [year, month, day] = fechaEntrega.split('-').map(Number);
    now.setFullYear(year);
    now.setMonth(month - 1);
    now.setDate(day);

    const fechaEntregaISO = now.toISOString();

   
    const params = new HttpParams()
      .set('idItem', idItem)
      .set('idBodega', idBodega)
      .set('funcionario', funcionario)
      .set('medioEntrega', medioEntrega)
      .set('cantidadAentregar', cantidadAentregar)
      .set('fechaEntrega', fechaEntregaISO)
      .set('tipoRecibe', tipoRecibe)
      .set('documentoRecibe', documentoRecibe)
      .set('idBodegaFormula', idBodegaFormula);
    return this.http.get<any>(`${this.urlEndPoint}/entrega/pendiente`, { params }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  subsanacionItemEntregaFormula(idItem: number, idBodega: number, funcionario: string, medioEntrega: string, cantidadAentregar: number) {
    // const headers = { 'Content-Type': 'application/json' };   
    const params = new HttpParams()
      .set('idItem', idItem)
      .set('idBodega', idBodega)
      .set('funcionario', funcionario)
      .set('medioEntrega', medioEntrega)
      .set('cantidadAentregar', cantidadAentregar);
    return this.http.get<any>(`${this.urlEndPoint}/entrega/subsanacion`, { params }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }


  getDxFormula(codigo: string): Observable<any> {
    const params = new HttpParams()
      .set('codigo', codigo);
    return this.http.get<any>(`${this.urlEndPoint}/cie`, { params });
  }


  getMedicamentoEntregadoPacienteMenosDe30Dias(idMedicamento: number, idPaciente: number): Observable<any> {
    const fechaFinal = new Date();
    const fechaFinalISO = fechaFinal.toISOString();
    const fechaInicial = new Date(fechaFinal);
    fechaInicial.setDate(fechaFinal.getDate() - 28);
    const fechaInicialISO = fechaInicial.toISOString();
    const params = new HttpParams()
      .set('idMedicamento', idMedicamento)
      .set('idPaciente', idPaciente)
      .set('fInicialstr', fechaInicialISO)
      .set('fFinalstr', fechaFinalISO);
    return this.http.get<any>(`${this.urlEndPoint}/medicamento/itemformula`, { params });
  }


  anularFormula(idFormula: number, funcionario: string, observacion: string) {
    // const headers = { 'Content-Type': 'application/json' };   
    const params = new HttpParams()
      .set('idFormula', idFormula)
      .set('observacion', observacion)
      .set('funcionario', funcionario);
    return this.http.get<any>(`${this.urlEndPoint}/anular`, { params }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }



  getCuotasModeradorasPDF(id: number, fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
      .set('idBodega', id)
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/cuotamoderadora`, { params }).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }


  getFormulasPrescritas(fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/prescritas`, { params }).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }


  getFormulasNoProcesadas(idBodega: number, fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
      .set('idBodega', idBodega)
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/noprocesadas`, { params }).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }


  getFormulasDetalladas(idBodega: number, fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
      .set('idBodega', idBodega)
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/reportes`, { params }).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }

 getFormulasDetalladasEstadistica(idBodega: number, fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
      .set('idBodega', idBodega)
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/reportesestadisticas`, { params }).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }

  getFormulasDetalladasAnuladas(idBodega: number, fInicial: string, fFinal: string): Observable<any> {
    const params = new HttpParams()
      .set('idBodega', idBodega)
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/anuladas`, { params }).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(e);
      }));
  }


  getMedicamentoentregadoPaciente(idMedicamento: number, idBodega: number, fInicial: string, fFinal: string): Observable<any> {

    const params = new HttpParams()
      .set('idMedicamento', idMedicamento)
      .set('idBodega', idBodega)
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/entrega/paciente`, { params }).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  }


  getMedicamentoentregadoPacientePendiente(idBodega: number, fInicial: string, fFinal: string): Observable<any> {

    const params = new HttpParams()
      .set('idBodega', idBodega)
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/entrega/pacientependiente`, { params }).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  }


  deleteItemFormula(idBodegaFormula: number, idItem: number, estadoFormula: boolean): Observable<void> {
    const params = new HttpParams()
      .set('idBodegaFormula', idBodegaFormula)
      .set('idItem', idItem)
      .set('estadoFormula', estadoFormula);
    return this.http.delete<void>(`${this.urlEndPoint}/item`, { params });
  }

  deleteItemFormulaEntrega(idItemEntrega: number, idMedicamento: number): Observable<void> {
    const params = new HttpParams()
      .set('idItemEntrega', idItemEntrega)
      .set('idMedicamento', idMedicamento);
    return this.http.delete<void>(`${this.urlEndPoint}/itementrega`, { params });
  }

  getFormulaIdPaciente(idPaciente: number, fInicial: string, fFinal: string): Observable<any> {

    const params = new HttpParams()
      .set('idPaciente', idPaciente)
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    return this.http.get<any>(`${this.urlEndPoint}/idpaciente`, { params }).pipe(
      catchError(e => {
        if (e.status != 401 && e.error.mensaje) {
          console.error(e.error.mensaje);
        }

        return throwError(e);
      }));
  }

  public subirFormula(soporte: File, idFormula: number): Observable<string> {
    const formData = new FormData();
    formData.append('soporte', soporte);
    formData.append('idFormula', idFormula.toString());
    return this.http.post(`${this.urlEndPoint}/subir`, formData, { responseType: 'text' });
  }

  desprocesarFormula(idFormula: number, idBodega: number) {
    const params = new HttpParams()
      .set('idFormula', idFormula)
      .set('idBodega', idBodega);
    return this.http.put<any>(`${this.urlEndPoint}/entrega/desprocesar`, null, { params }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  guardarCodigoVerificado(idFormula: number, codigoVerificado: string) {
    const params = new HttpParams()
      .set('idFormula', idFormula)
      .set('codigoVerificado', codigoVerificado);

    return this.http.get<any>(`${this.urlEndPoint}/codigoverificado`, { params }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

  getValorventaMedicamentosEps(idMedicamento: number, codEps: string): Observable<EpsMedicamentoI> {
    const params = new HttpParams()
      .set('idMedicamento', idMedicamento.toString())
      .set('codEps', codEps);

    // Especificamos <EpsMedicamentoI> para que TypeScript sepa que viene un objeto, no un array
    return this.http.get<EpsMedicamentoI>(`${this.urlEndPoint}/valormedicamentoventa`, { params }).pipe(
      catchError(e => {
        // Opcional: Manejo de error 404 personalizado si no existe el precio
        return throwError(() => e);
      })
    );
  }

  getReporteSinSoporte(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/sinsoporte`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }

        return throwError(() => e);

      })
    );
  }

  getReporteEditadas(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/editadas`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }

  getReporteAnuladas(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/anuladas`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }

  getReportePqrs(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/pqrs`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }

  getReporteMedicamentoEntregado(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/medicamentoentregado`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }


  getReporteTopIps(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/topips`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }


  getReporteTopMedico(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/topmedico`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }


  getReporteTopMedicoMedicamento(idBodega: number, fInicial: string, fFinal: string, idMedicamento: number, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal)
      .set('idMedicamento', idMedicamento.toString());
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/topmedicomedicamento`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }


  getReporteTopMedicoIps(idBodega: number, fInicial: string, fFinal: string, idMedico: number, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal)
      .set('idMedico', idMedico.toString());
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/topmedicoips`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }


  getReporteTopMedicoMedicamentoIps(idBodega: number, fInicial: string, fFinal: string, idMedicamento: number, idMedico: number, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal)
      .set('idMedicamento', idMedicamento.toString())
      .set('idMedico', idMedico.toString());
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/topmedicomedicamentoips`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }



  getReporteTopMedicamentoFrecuencia(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/topfmedicamento`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }


  getReporteTopMedicamentoCantidad(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/topcmedicamento`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }

  getReporteMedicamentoPromedio(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/medicamentopromedio`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }


  getReporteEntregaPendiente(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/entregapendiente`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }


  getReporteSubsanacionAdministrativa(idBodega: number, fInicial: string, fFinal: string, codEps?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('idBodega', idBodega.toString())
      .set('fInicial', fInicial)
      .set('fFinal', fFinal);
    // Agregar cada EPS como un parámetro independiente
    if (codEps?.length) {
      codEps.forEach(codigo => {
        params = params.append('codEps', codigo);
      });
    }
    return this.http.get<any>(
      `${this.urlEndPoint}/reportes/subsanacionadministrativa`,
      { params }
    ).pipe(
      catchError(e => {

        if (e.status !== 401 && e.error?.mensaje) {
          console.error(e.error.mensaje);
        }
        return throwError(() => e);
      })
    );
  }



}
