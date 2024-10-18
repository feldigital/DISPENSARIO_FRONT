import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, throwError } from 'rxjs';
import { FormulaI } from '../modelos/formula.model';
import { MedicamentoI } from '../modelos/medicamento.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormulaService {
  

  private urlEndPoint = environment.apiUrl+'/formula';
  constructor(private http: HttpClient) { }

  

  getFormulaId(id: number): Observable<any> {
    const params = new HttpParams()
    .set('id', id);
    return this.http.get<any>(`${this.urlEndPoint}/unica`, {params});
  }

  delete(id: number): Observable<void> {
    const params = new HttpParams()
    .set('id', id);
    return this.http.delete<void>(`${this.urlEndPoint}`, {params});
  }

  

  create(registro: FormulaI): Observable<FormulaI> {
    const headers = { 'Content-Type': 'application/json' };   
    //console.log(JSON.stringify(registro));
    console.log(registro);
    return this.http.post<FormulaI>(this.urlEndPoint, JSON.stringify(registro), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
}


filtrarMedicamentos(term: string): Observable<MedicamentoI[]> {
  const encodedTerm = encodeURIComponent(term);
  const params = new HttpParams()
  .set('term', encodedTerm);
  return this.http.get<MedicamentoI[]>(`${this.urlEndPoint}/filtrar-medicamento`, {params}).pipe(
    catchError(this.handleError<MedicamentoI[]>('filtrarMedicamentos', []))
  );
}


filtrarMedicamentosEps(term: string,codEps: string): Observable<MedicamentoI[]> {
  const encodedTerm = encodeURIComponent(term);
  const params = new HttpParams()
  .set('term', encodedTerm)
  .set('codEps', codEps);
  return this.http.get<MedicamentoI[]>(`${this.urlEndPoint}/filtrar-medicamento-eps`, {params}).pipe(
    catchError(this.handleError<MedicamentoI[]>('filtrarMedicamentos', []))
  );
}

private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed: ${error.message}`);
    return of(result as T);
  };
} 

saveEntregaFormula(idFormula: number,idBodega: number, funcionario: string , medioEntrega: string, tipoRecibe: string, documentoRecibe: string) {
 // const headers = { 'Content-Type': 'application/json' }; 
 const   fechaEntrega=new Date();
 const fechaEntregaISO = fechaEntrega.toISOString();
  const params = new HttpParams()
  .set('idFormula', idFormula)
  .set('idBodega', idBodega)
  .set('funcionario', funcionario)
  .set('medioEntrega', medioEntrega)
  .set('fechaEntrega', fechaEntregaISO)
  .set('tipoRecibe', tipoRecibe)
  .set('documentoRecibe', documentoRecibe) ;
  return this.http.get<any>(`${this.urlEndPoint}/entrega`, {params}).pipe(
  catchError(e => {
    return throwError(e);
  })
);
}


saveItemEntregaFormula(idItem: number,idBodega: number, funcionario: string, medioEntrega: string, cantidadAentregar:number,tipoRecibe: string, documentoRecibe: string,fEntrega: string ) {
 // const headers = { 'Content-Type': 'application/json' };  
  const   fechaEntrega=new Date();
  const fechaEntregaISO = fechaEntrega.toISOString();
   const params = new HttpParams()
   .set('idItem', idItem)
   .set('idBodega', idBodega)
   .set('funcionario', funcionario)
   .set('medioEntrega', medioEntrega)
   .set('cantidadAentregar', cantidadAentregar)
   .set('fechaEntrega', fechaEntregaISO) 
   .set('tipoRecibe', tipoRecibe)
   .set('documentoRecibe', documentoRecibe) ;  
   return this.http.get<any>(`${this.urlEndPoint}/entrega/pendiente`, {params}).pipe(
   catchError(e => {
     return throwError(e);
   })
 );
 }

 subsanacionItemEntregaFormula(idItem: number,idBodega: number, funcionario: string, medioEntrega: string, cantidadAentregar:number) {
  // const headers = { 'Content-Type': 'application/json' };   
   const params = new HttpParams()
   .set('idItem', idItem)
   .set('idBodega', idBodega)
   .set('funcionario', funcionario)
   .set('medioEntrega', medioEntrega)
   .set('cantidadAentregar', cantidadAentregar);    
   return this.http.get<any>(`${this.urlEndPoint}/entrega/subsanacion`, {params}).pipe(
   catchError(e => {
     return throwError(e);
   })
 );
 }


 getDxFormula(codigo: string): Observable<any> {
  const params = new HttpParams()
  .set('codigo', codigo);
  return this.http.get<any>(`${this.urlEndPoint}/cie`, {params});
}


getMedicamentoEntregadoPacienteMenosDe30Dias(idMedicamento: number,idPaciente: number): Observable<any> {
 const   fechaFinal=new Date();
 const fechaFinalISO = fechaFinal.toISOString();
 const fechaInicial = new Date(fechaFinal);
 fechaInicial.setDate(fechaFinal.getDate() - 30);
 const fechaInicialISO =fechaInicial.toISOString();
  const params = new HttpParams()
  .set('idMedicamento', idMedicamento)
  .set('idPaciente', idPaciente)
  .set('fInicialstr', fechaInicialISO)
  .set('fFinalstr', fechaFinalISO);  
  return this.http.get<any>(`${this.urlEndPoint}/medicamento/itemformula`, {params});
}


anularFormula(idFormula: number, funcionario: string, observacion: string) {
  // const headers = { 'Content-Type': 'application/json' };   
   const params = new HttpParams()
   .set('idFormula', idFormula)
   .set('observacion', observacion)
   .set('funcionario', funcionario);    
   return this.http.get<any>(`${this.urlEndPoint}/anular`, {params}).pipe(
   catchError(e => {
     return throwError(e);
   })
 );
 }


 
getCuotasModeradorasPDF(id: number,fInicial: string, fFinal: string): Observable<any> {
  const params = new HttpParams()
  .set('idBodega', id)
  .set('fInicial', fInicial)
  .set('fFinal', fFinal);
   return this.http.get<any>(`${this.urlEndPoint}/cuotamoderadora`, {params}).pipe(
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
   return this.http.get<any>(`${this.urlEndPoint}/prescritas`, {params}).pipe(
    catchError(e => {
      if (e.status != 401 && e.error.mensaje) {        
        console.error(e.error.mensaje);
      }

      return throwError(e);
    }));
 }


}
