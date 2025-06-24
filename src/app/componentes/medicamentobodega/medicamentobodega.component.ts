import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, debounceTime, of, switchMap } from 'rxjs';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-medicamentobodega',
  templateUrl: './medicamentobodega.component.html',
  styleUrls: ['./medicamentobodega.component.css']
})
export class MedicamentobodegaComponent implements OnInit { //, OnChanges{
  generalForm!: FormGroup;
  listaItemBodega: any = [];
  listaItemBodegaFiltro: any = [];
  parametro: any;
  @Input() datoRecibido: number = NaN;
  listaregistros: any;
  parametroInicializado: boolean = false; // ⭐ para controlar si ya cargaste una vez


  constructor(
    private servicio: BodegaService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute) { }

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

    // Inicializar el formulario
    this.generalForm = this.fb.group({
      idBodega: [this.parametro],
      listFilter: [''],
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

        if (this.parametro) {
          this.generalForm.patchValue({ idBodega: +this.parametro }, { emitEvent: false });
        }
      },
      (err: any) => {
        console.error(err);
      }
    );

    this.generalForm
      .get('listFilter')!
      .valueChanges.pipe(
        debounceTime(300),
        switchMap((query) => this.buscarMedicamentos(query))
      )
      .subscribe((results) => {
        this.listaItemBodegaFiltro = results;
      });

    this.generalForm.get('idBodega')!.valueChanges.subscribe((nuevoIdBodega: number) => {
      if (nuevoIdBodega) {
        this.parametro = nuevoIdBodega;
        this.buscarRegistro(nuevoIdBodega);
      }
    });
  }



  public async buscarRegistro(id: number) {
    if (!id || isNaN(id) || id === 0) {
      console.warn('❌ ID inválido para buscar registros:', id);
      return; // Salir sin hacer nada
    }

    // Limpiar listas antes de cargar nueva data
    this.listaItemBodega = [];
    this.listaItemBodegaFiltro = [];
    // Mostrar spinner mientras carga
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.servicio.getRegistrosMedicamentoBodega(id)
      .subscribe((resp: any) => {
        this.listaItemBodega = resp.map((item: any) => ({
          ...item,
          editing: false,
        }));
        console.log(resp);
        this.listaItemBodega.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        this.listaItemBodegaFiltro = this.listaItemBodega
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
     // Validar que los campos obligatorios no estén vacíos
  if (!itemt.invima || !itemt.laboratorio || !itemt.lote || !itemt.fechaVencimiento || itemt.stopMinimo == null) {
    Swal.fire('Campos incompletos', 'Por favor complete todos los campos antes de guardar.', 'warning');
    return;
  }
  // Validar que el stock sea un número válido y positivo
  if (isNaN(itemt.stopMinimo) || itemt.stopMinimo < 0) {
    Swal.fire('Stock inválido', 'El stock mínimo debe ser un número positivo.', 'warning');
    return;
  }
   // Validar que el stock sea un número válido y positivo
   if (isNaN(itemt.pendiente) || itemt.pendiente < 0) {
    Swal.fire('Pendiente inválido', 'El pendiente debe ser un número positivo.', 'warning');
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
     <p style="margin:2px 0;"><strong>Stock mínimo:</strong> ${itemt.stopMinimo}</p>
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

  public eliminarMedicamentoBodega(itemt: any) {
    if (itemt.cantidad <= 0) {
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
        }
      });
    }
    else {
      Swal.fire({
        icon: 'info',
        title: `Falta de permisos`,
        text: `No tienes permisos para eliminar un medicamento de la bodega  ${itemt.nombreBodega} comunicate con el área de sistemas para el proceso.`,
      });

    }
  }

  
  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem("nivel"));  
    if (isNaN(nivelUsuario)) {
      //console.warn("El nivel del usuario no es válido o no está definido");
      return false;
    }  
    return nivelUsuario >= nivelRequerido;
  }


  
  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}
