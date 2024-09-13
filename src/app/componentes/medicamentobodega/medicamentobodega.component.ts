import { Component, Input, OnChanges,  OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, debounceTime, of, switchMap } from 'rxjs';
import { FormulaI } from 'src/app/modelos/formula.model';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-medicamentobodega',
  templateUrl: './medicamentobodega.component.html',
  styleUrls: ['./medicamentobodega.component.css']
})
export class MedicamentobodegaComponent implements OnInit, OnChanges {
  generalForm!: FormGroup;
  listaItemBodega: any = [];
  listaItemBodegaFiltro: any = [];
  parametro: any;
  @Input() datoRecibido: number= NaN;

/*
  
  _listFilter!: string;
  get listFilter(): string {
    return this._listFilter;
  }
  set listFilter(value: string) {
    this._listFilter = value;
    this.listaItemBodegaFiltro = this.listFilter ? this.performFilter(this.listFilter) : this.listaItemBodega;
  }
*/

  constructor(
    private servicio: BodegaService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router) { }
/*
    performFilter(filterBy: string): any[] {
      if (filterBy === '' || filterBy.length < 3) return this.listaItemBodega
      filterBy = filterBy.toLocaleLowerCase();
      return this.listaItemBodega.filter((filro: any) => filro.medicamento.nombre.toLocaleLowerCase().indexOf(filterBy) !== -1
        );
    
    }
  */

  ngOnInit(): void {
// Configurar un intervalo que verifique la condición cada minuto (60000 milisegundos)
    this.parametro=this.datoRecibido
    this.activatedRoute.paramMap.subscribe(params => {
      this.parametro = params.get('id');   
      if (this.parametro) {
      this.buscarRegistro(this.parametro);
    }
    });
    if (this.datoRecibido) {
      this.buscarRegistro(this.datoRecibido);
    } 
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
      this.listaItemBodegaFiltro = results        
    });


  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datoRecibido'] && !changes['datoRecibido'].isFirstChange()) {
      this.buscarRegistro(this.datoRecibido);
    }
  }

  public buscarRegistro(id:number)
  {
    this.servicio.getRegistrosMedicamentoBodega(id)
    .subscribe((resp: any) => {
      this.listaItemBodega = resp.map((item: any) => ({
        ...item,
        estado: false, // O cualquier lógica que determine el estado
        editing: false,
      }));
     
      this.listaItemBodega.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
      this.listaItemBodegaFiltro=this.listaItemBodega
      console.log(this.listaItemBodega);
    });

  }

  buscarMedicamentos(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.length > 3) {
      filterValue = filterValue.toLocaleLowerCase();
      const filteredResults = this.listaItemBodega.filter((item: any) =>
        item.nombre.toLowerCase().includes(filterValue)
      );
      return of(filteredResults);
    }
    // Retornar la lista completa si no se cumplen las condiciones
    return of(this.listaItemBodega);
  }


  public editarMedicamentoBodega(itemt: any) {
    itemt.editing = true;
  }

  public guardarMedicamentoBodega(itemt: any) {
    itemt.editing = false;
    // Aquí puedes añadir lógica para guardar los cambios en el servidor si es necesario   
  }

  

  public eliminarMedicamentoBodega(itemt: any)
  {
   if(itemt.cantidad<=0){
    Swal.fire({
      title: 'Desea eliminar?',
      text: `El medicamento ${itemt.medicamento.nombre} de la bodega  ${itemt.bodega.nombre} - ${itemt.bodega.puntoEntrega}   en la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.deleteMedicamentoBodegaId(itemt.idMedicamentoBodega).subscribe(resp => {
          this.listaItemBodega = this.listaItemBodega.filter((cli: FormulaI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El medicamento ${itemt.medicamento.nombre} de la bodega  ${itemt.bodega.nombre} - ${itemt.bodega.puntoEntrega} ha sido eliminado correctamente.`,
          });
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: `Error`,
              text: err.mensaje,
            });
          });
      }
    });

  }
  else{
    Swal.fire({
      icon: 'warning',
      title: `Verificar!`,
      text: `El medicamento ${itemt.medicamento.nombre} de la bodega  ${itemt.bodega.nombre} - ${itemt.bodega.puntoEntrega} tiene existencia actual por lo tanto no puede ser eliminado.`,
    });
  }
  }  

 
   public crearMEdicamentoBodega(itemt: any) {   
    console.log(itemt);
    this.servicio.createMedicamentoBodega(itemt)
    .subscribe({
      next: (data: any) => {
        this.router.navigate(['/entrega', itemt.idFormula]); 
      },
      error: (err) => {
        console.error('Error al adicionar el medicamento a la bodega', err);
      }
    });
      
   }


  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}
