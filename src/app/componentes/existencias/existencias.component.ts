import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, map, Observable, of, switchMap } from 'rxjs';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { FormulaService } from 'src/app/servicios/formula.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { OrdendespachoService } from 'src/app/servicios/ordendespacho.service';

@Component({
  selector: 'app-existencias',
  templateUrl: './existencias.component.html',
  styleUrls: ['./existencias.component.css']
})
export class ExistenciasComponent {
  generalForm!: FormGroup;
  listaItemBodega: any = [];
  listaExistencia: any = [];
  medicamentosFiltrados: any[] = [];
  medicamentoActual: any = NaN;  
  listaItemEnvio: any = [];
  totalCantidadExistencia:number =0;
  totalCantidadPendiente:number =0;
   totalCantidadCanje:number =0;

  constructor(
    private servicio: BodegaService,
    private formulaService: FormulaService,
    private ordendespachoservicio: OrdendespachoService,
    private fb: FormBuilder   
   ) { }

  ngOnInit(): void {
    this.generalForm = this.fb.group
    ({
      medicamento:[''],
      estado:['true'],
     });

    this.generalForm.get('medicamento')!.valueChanges
    .pipe(
      debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir    
      map(value => {
            if (typeof value === 'string') {
              return value.trim().toLowerCase();
            } else if (value && typeof value === 'object' && 'nombre' in value) {
              return value.nombre.toLowerCase(); // si ya seleccionó un medicamento
            } else {
              return '';
            }
          }),    
      switchMap(query => {
      if (query.length >= 3 ) {
          return this.formulaService.filtrarMedicamentos(query);
      } else {
        return of([]);
      }
    })
  )
    .subscribe(results => {
      this.medicamentosFiltrados = results;
    });

    // Escucha cambios del checkbox
  this.generalForm.get('estado')?.valueChanges.subscribe(() => {
    this.aplicarFiltroCantidad();
  });

  }

     seleccionarMedicamento(event: MatAutocompleteSelectedEvent): void {
      this.medicamentoActual = event.option.value.idMedicamento;        
      this.generalForm.get('medicamento')?.setValue(event.option.value.nombre);
      this.buscarRegistro(this.medicamentoActual);
      this.buscarRegistroEnvio(this.medicamentoActual);
    }

  buscarRegistro(idMedicamento: number): Observable<any[]> {
     this.totalCantidadExistencia=0;
     this.totalCantidadPendiente=0;
    if(idMedicamento){
        this.servicio.getExistenciasMedicamentoPuntual(idMedicamento)
          .subscribe((resp: any) => {
            
            this.listaItemBodega = resp.sort((a: any, b: any) => a.dato_5.localeCompare(b.dato_5));    
            this.listaExistencia=  this.listaItemBodega;
            // Calcular totales
            this.totalCantidadExistencia = resp.reduce((sum:number, item:any) => sum + (item.d_1 || 0), 0);
            this.totalCantidadPendiente  = resp.reduce((sum:number, item:any) => sum + (item.d_2 || 0), 0);

             this.aplicarFiltroCantidad(); // ← Aplica el filtro después de cargar
          });
        return of(this.listaItemBodega); // Usa `this` para referirte a la variable de instancia
      }
      // Retornar la lista vacía si no se cumplen las condiciones
      return of([]);
  }

  buscarRegistroEnvio(idMedicamento: number): Observable<any[]> {     
    this.totalCantidadCanje=0;
    if(idMedicamento){
        this.ordendespachoservicio.getMedicamentoOrdenDespachoEnvio(idMedicamento)
          .subscribe((resp: any) => {
            this.listaItemEnvio = resp; //.sort((a: any, b: any) => a.dato_5.localeCompare(b.dato_5));   
            this.totalCantidadCanje  = resp.reduce((sum:number, item:any) => sum + (item.cantidad || 0), 0);        
          });
        return of(this.listaItemEnvio); // Usa `this` para referirte a la variable de instancia
      }
      // Retornar la lista vacía si no se cumplen las condiciones
      return of([]);
  }
      
aplicarFiltroCantidad(): void {
  const soloConExistencias = this.generalForm.get('estado')?.value === true || this.generalForm.get('estado')?.value === 'true';
  
  if (soloConExistencias) {
    this.listaItemBodega = this.listaItemBodega.filter((item: any) => item.d_1 > 0);
  } else {
    this.listaItemBodega =this.listaExistencia;
  }
}



  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}
