import { Component, Input,ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-norotan',
  templateUrl: './norotan.component.html',
  styleUrls: ['./norotan.component.css']
})
export class NorotanComponent {
  listaNorotanBodega: any = [];
  listaNorotanBodegaFiltro: any = [];
  parametro: any;
  @Input() datoRecibido: number = NaN;
  generalForm!: FormGroup;
  listaregistros: any;

  constructor(
    private servicio: BodegaService,
    private activatedRoute: ActivatedRoute, 
    private cdr: ChangeDetectorRef, 
    private fb: FormBuilder) {
    // Calcula la fecha actual
    const currentDate = new Date();
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 180);
 
    this.generalForm = this.fb.group({
      idBodega: [0],
      fechainicial: [date30DaysAgo.toISOString().split('T')[0]],
      fechafinal: [currentDate.toISOString().split('T')[0]],
      listFilter: [''],   
    });


  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const idParam = params.get('id');       
        if (idParam && !isNaN(Number(idParam))) {
          this.parametro = Number(idParam);
          this.buscarRegistro(this.parametro);          
        } else {
          this.parametro = parseInt(sessionStorage.getItem('bodega') || '0', 10);
          if (this.parametro && !isNaN(this.parametro)) {
            this.buscarRegistro(this.parametro);             
          }
        }
     
    });


    this.servicio.getRegistrosActivos().subscribe(
      (resp: any) => {

        this.listaregistros = resp.filter((registro: any) => registro.dispensa === true);
        this.listaregistros.sort((a: any, b: any) => {
          const comparacionPorNombre = a.nombre.localeCompare(b.nombre);
          if (comparacionPorNombre === 0) {
            return a.puntoEntrega.localeCompare(b.puntoEntrega);
          }
          return comparacionPorNombre;
        });

        // Establecer el valor del select después de que se cargan los registros
        if (this.parametro) {
          this.generalForm.patchValue({ idBodega: +this.parametro }, { emitEvent: false });
        }
      },
      (err: any) => {
        console.error(err);
      }
    );

    this.generalForm.get('listFilter')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
        switchMap(query => this.buscarMedicamentos(query))
      )
      .subscribe(results => {
        this.listaNorotanBodegaFiltro = results
      });

    // Escuchar cambios en el select de bodegas
    this.generalForm.get('idBodega')!.valueChanges.subscribe((nuevoIdBodega: number) => {
       this.cdr.detectChanges(); // 👈 fuerza actualización del DOM
      if (nuevoIdBodega) {
        this.parametro = nuevoIdBodega;
        this.buscarRegistro(nuevoIdBodega);
      }
    });

    this.generalForm.patchValue({ idBodega: this.datoRecibido });
 

  }




  public async buscarRegistro(id: number) {   
    // Limpiar listas antes de cargar nueva data
    this.listaNorotanBodega = [];
    this.listaNorotanBodegaFiltro = [];

     Swal.fire({
          title: 'Cargando registros...',
          html: 'Por favor espera un momento',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

    this.servicio.getMedicamentosNorotan(id, this.generalForm.get('fechainicial')?.value)
      .subscribe((resp: any) => {       
        this.listaNorotanBodega = resp
        this.listaNorotanBodega.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));        
        this.listaNorotanBodegaFiltro = this.listaNorotanBodega
      Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
          },
          (error) => {
            console.error('❌ Error cargando registros', error);
            Swal.close(); // 🚨 Primero cerramos el spinner
            Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
          }
        );
  }

  buscarMedicamentos(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.length > 3) {
      filterValue = filterValue.toLocaleLowerCase();
      const filteredResults = this.listaNorotanBodega.filter((item: any) =>
        item.nombre.toLowerCase().includes(filterValue)
      );
      return of(filteredResults);
    }
    // Retornar la lista completa si no se cumplen las condiciones
    return of(this.listaNorotanBodega);
  }

 
  esFechaVencimientoProxima(fecha: Date | string): boolean {
  const hoy = new Date();
  const seisMesesDespues = new Date();
  seisMesesDespues.setMonth(hoy.getMonth() + 6);

  const fechaVenc = new Date(fecha);
  return fechaVenc < seisMesesDespues;
}

get fechaFiltro(): Date {
  return this.generalForm.get('fechainicial')?.value;
}


get todasBodega(): boolean {
   const val = this.generalForm.get('idBodega')?.value;
  console.log('Valor actual de bodega:', val);
  return val === 0;
    //return this.generalForm.get('idBodega')?.value === 0;
}

  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}

