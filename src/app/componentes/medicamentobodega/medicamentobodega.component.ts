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
  listaregistros: any;


  constructor(
    private servicio: BodegaService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router) { }


    ngOnInit(): void {
      this.parametro = this.datoRecibido;
      this.activatedRoute.paramMap.subscribe((params) => {
        this.parametro = params.get('id');   
        if (this.parametro) {
          this.buscarRegistro(this.parametro);
        } else {
          this.parametro = parseInt(sessionStorage.getItem('bodega') || '0', 10);
          this.buscarRegistro(this.parametro);
        }
      });
    
      if (this.datoRecibido!=this.parametro) {
        this.buscarRegistro(this.datoRecibido);
      }
    
      // Inicialización del formulario
      this.generalForm = this.fb.group({
        idBodega: [this.parametro], // Select de bodegas
        listFilter: [''], // Input de filtro
      });
    
      this.servicio.getRegistrosActivos().subscribe(
        (resp: any) => {
          this.listaregistros = resp;
          this.listaregistros.sort((a: any, b: any) => {
            const comparacionPorNombre = a.nombre.localeCompare(b.nombre);
            if (comparacionPorNombre === 0) {
              return a.puntoEntrega.localeCompare(b.puntoEntrega);
            }
            return comparacionPorNombre;
          });
      
          // Establecer el valor del select después de que se cargan los registros
          if (this.parametro) {
            this.generalForm.patchValue({ idBodega: +this.parametro });
          }
        },
        (err: any) => {
          console.error(err);
        }
      );
    
      // Escuchar cambios en el input de filtro
      this.generalForm
        .get('listFilter')!
        .valueChanges.pipe(
          debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
          switchMap((query) => this.buscarMedicamentos(query))
        )
        .subscribe((results) => {
          this.listaItemBodegaFiltro = results;
        });
    
      // Escuchar cambios en el select de bodegas
      this.generalForm.get('idBodega')!.valueChanges.subscribe((nuevoIdBodega: number) => {
        if (nuevoIdBodega) {
          this.parametro = nuevoIdBodega;
          this.buscarRegistro(nuevoIdBodega);
        }
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

  public cancelEdicion(itemt: any) {
    itemt.editing = false;   
  }

  public eliminarMedicamentoBodega(itemt: any)
  {
   
   if(itemt.cantidad<=0){
    Swal.fire({
      title: 'Desea eliminar?',
      text: `El medicamento ${itemt.nombre} de la bodega  ${itemt.nombreBodega} en la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        
        Swal.fire({
          icon: 'info',
          title: `Falta de permisos`,
          text: `No tienes permisos para eliminar un medicamento de la bodega  ${itemt.nombreBodega} comunicate con el área de sistemas para el proceso.`,
        });
        /*this.servicio.deleteMedicamentoBodegaId(itemt.idMedicamentoBodega).subscribe(resp => {
          this.listaItemBodega = this.listaItemBodega.filter((cli: FormulaI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El medicamento ${itemt.nombre} de la bodega  ${itemt.nombreBodega} ha sido eliminado correctamente.`,
          });
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: `Error`,
              text: err.mensaje,
            });
          });
          */
      }
    });

  }
  else{
    Swal.fire({
      icon: 'info',
      title: `Falta de permisos`,
      text: `No tienes permisos para eliminar un medicamento de la bodega  ${itemt.nombreBodega} comunicate con el área de sistemas para el proceso.`,
    });
    /*
    Swal.fire({
      icon: 'warning',
      title: `Verificar!`,
      text: `El medicamento ${itemt.nombre} de la bodega  ${itemt.nombreBodega} tiene existencia actual por lo tanto no puede ser eliminado.`,
    });
    */
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
