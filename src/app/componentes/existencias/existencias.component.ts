import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
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
  medicamentosFiltrados: any[] = [];
  medicamentoActual: any = NaN;
  listaItemEnvio: any = [];

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
     });

    this.generalForm.get('medicamento')!.valueChanges
    .pipe(
      debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir          
      switchMap(query => {
        return this.formulaService.filtrarMedicamentos(query);
      })
    )
    .subscribe(results => {
      this.medicamentosFiltrados = results;
    });


  }

     seleccionarMedicamento(event: MatAutocompleteSelectedEvent): void {
      this.medicamentoActual = event.option.value.idMedicamento;        
      this.generalForm.get('medicamento')?.setValue(event.option.value.nombre);
      this.buscarRegistro(this.medicamentoActual);
      this.buscarRegistroEnvio(this.medicamentoActual);
    }

  buscarRegistro(idMedicamento: number): Observable<any[]> {
     
    if(idMedicamento){
        this.servicio.getExistenciasMedicamentoPuntual(idMedicamento)
          .subscribe((resp: any) => {
            this.listaItemBodega = resp.sort((a: any, b: any) => a.dato_5.localeCompare(b.dato_5));           
          });
        return of(this.listaItemBodega); // Usa `this` para referirte a la variable de instancia
      }
      // Retornar la lista vacía si no se cumplen las condiciones
      return of([]);
  }

  buscarRegistroEnvio(idMedicamento: number): Observable<any[]> {     
    if(idMedicamento){
        this.ordendespachoservicio.getMedicamentoOrdenDespachoEnvio(idMedicamento)
          .subscribe((resp: any) => {
            this.listaItemEnvio = resp //.sort((a: any, b: any) => a.dato_5.localeCompare(b.dato_5));           
          });
        return of(this.listaItemEnvio); // Usa `this` para referirte a la variable de instancia
      }
      // Retornar la lista vacía si no se cumplen las condiciones
      return of([]);
  }
      

  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}
