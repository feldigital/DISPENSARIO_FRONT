import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { BodegaService } from 'src/app/servicios/bodega.service';

@Component({
  selector: 'app-existencias',
  templateUrl: './existencias.component.html',
  styleUrls: ['./existencias.component.css']
})
export class ExistenciasComponent {

  generalForm!: FormGroup;
  listaItemBodega: any = [];


  constructor(
    private servicio: BodegaService,
    private fb: FormBuilder   
   ) { }


  ngOnInit(): void {

    this.generalForm = this.fb.group
    ({
      listFilter:[''],
     });

    this.generalForm.get('listFilter')!.valueChanges
    .pipe(
      debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
      switchMap(query => this.buscarMedicamentos(query))
    )
    .subscribe(results => {       
      this.listaItemBodega = results        
    });


  }


  buscarMedicamentos(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.length > 3) {   
        this.servicio.getExistenciasMedicamentos(filterValue)
          .subscribe((resp: any) => {
            this.listaItemBodega = resp; // Asigna la respuesta a la lista de instancia
            this.listaItemBodega.sort((a: any, b: any) => a.dato_1.localeCompare(b.dato_1));
          });
        return of(this.listaItemBodega); // Usa `this` para referirte a la variable de instancia
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
