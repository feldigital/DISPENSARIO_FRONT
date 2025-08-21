import { Component, Input,ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vencidos',
  templateUrl: './vencidos.component.html',
  styleUrls: ['./vencidos.component.css']
})
export class VencidosComponent {

  listaVencidosBodega: any = [];
  listaVencidosBodegaFiltro: any = [];
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
    date30DaysAgo.setDate(currentDate.getDate() - 0);
 
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

        this.listaregistros = resp.filter((registro: any) => registro.inventario === true);
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
        this.listaVencidosBodegaFiltro = results
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
    this.listaVencidosBodega = [];
    this.listaVencidosBodegaFiltro = [];
     Swal.fire({
          title: 'Cargando registros...',
          html: 'Por favor espera un momento',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

    this.servicio.getMedicamentosVencidos(id, this.generalForm.get('fechainicial')?.value)
      .subscribe((resp: any) => {    
        this.listaVencidosBodega = resp.map((item: any) => ({
          ...item,
          editing: false,
        }));     
             
        this.listaVencidosBodega.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));        
        this.listaVencidosBodegaFiltro = this.listaVencidosBodega
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
  if (filterValue && filterValue.trim().length > 3) {
    const palabras = filterValue.toLowerCase().trim().split(/\s+/); // dividir por espacios
    const filteredResults = this.listaVencidosBodega.filter((item: any) => {
      const nombre = item.nombre.toLowerCase();
      // Verificar que todas las palabras estén en el nombre
      return palabras.every(palabra => nombre.includes(palabra));
    });
    return of(filteredResults);
  }
  // Si no hay filtro, devolver la lista completa
  return of(this.listaVencidosBodega);
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
  return val === 0;  
}


  public editarMedicamentoBodega(itemt: any) {
      this.listaVencidosBodegaFiltro.forEach((p: any) => p.editing = false);
      itemt.editing = true;
    

  }

  public guardarMedicamentoBodega(itemt: any) {  
     // Validar que los campos obligatorios no estén vacíos
  if (!itemt.invima || !itemt.laboratorio || !itemt.lote || !itemt.fechaVencimiento ) {
    Swal.fire('Campos incompletos', 'Por favor complete todos los campos antes de guardar.', 'warning');
    return;
  }
  
 // Validar que la fecha de vencimiento no sea menor a la fecha actual
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Eliminar hora para comparar solo fecha
  const fechaVenc = new Date(itemt.fechaVencimiento);
  fechaVenc.setHours(0, 0, 0, 0);

  if (fechaVenc < hoy) {
    Swal.fire('Fecha de vencimiento inválida', 'La fecha de vencimiento no puede ser menor a la fecha actual.', 'error');
    return;
  }
  
    // Convertir a mayúsculas
  itemt.invima = itemt.invima.toUpperCase();
  itemt.laboratorio = itemt.laboratorio.toUpperCase();
  itemt.lote = itemt.lote.toUpperCase();

    // Formatea la fecha en formato legible para Colombia
    const fecha = new Date(itemt.fechaVencimiento);
    const fechaFormateada = fecha.toLocaleDateString('es-CO');
    itemt.editing = false;
    Swal.fire({
      title: '¿Desea actualizar?',
      html: `
      <p style="margin:2px 0;"><strong>Medicamento:</strong> ${itemt.nombre}</p>
      <p style="margin:2px 0;"><strong>Invima:</strong> ${itemt.invima}</p>
      <p style="margin:2px 0;"><strong>Laboratorio:</strong> ${itemt.laboratorio}</p>
      <p style="margin:2px 0;"><strong>Lote:</strong> ${itemt.lote}</p>
      <p style="margin:2px 0;"><strong>Fecha Vencimiento:</strong> ${fechaFormateada}</p>
    
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Actualizar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.updateMedicamentoBodega(itemt).subscribe(
          (resp: any) => {
            Swal.fire({
              icon: 'success',
              title: `Actualización exitosa`,
              text: `Los datos del medicamento ${itemt.nombre} de la bodega seleccionada fueron actualizados correctamente.`,
            });
          },
          (error) => {
            console.error('❌ Error actualizando el registro', error);
            Swal.fire('Error', 'No se pudo actualizar el registro.', 'error');
          }
        );
      }
    });
  }
  public cancelEdicion(itemt: any) {
    itemt.editing = false;
  }


  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}

