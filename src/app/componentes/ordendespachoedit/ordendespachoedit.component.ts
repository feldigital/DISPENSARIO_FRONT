import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrdendespachoService } from 'src/app/servicios/ordendespacho.service';
import Swal from 'sweetalert2';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ItemOrdenDespachoI } from 'src/app/modelos/ItemOrdenDespacho.model';
import { FormulaService } from 'src/app/servicios/formula.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs';
import { MedicamentoService } from 'src/app/servicios/medicamento.service';

@Component({
  selector: 'app-ordendespachoedit',
  templateUrl: './ordendespachoedit.component.html',
  styleUrls: ['./ordendespachoedit.component.css']
})
export class OrdendespachoeditComponent implements OnInit {

  listaItemsFormula: any;
  listaregistros: any;
  parametro: any;
  medicamentosFiltrados: any[] = [];
  generalForm!: FormGroup;
  medicamentoSeleccionado: any;
  verItem: boolean = false;

  itemNuevo = {
    id: '',
    medicamento: '',
    presentacion: '',
    existencia: 0,
  };

  constructor(
    private ordenDespachoservicio: OrdendespachoService,
    private activatedRoute: ActivatedRoute,
    private formulaService: FormulaService,
    private medicamentoService: MedicamentoService,
    private fb: FormBuilder) {
  }
  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      this.parametro = params.get('id');
      if (this.parametro) {
        this.buscarRegistro(this.parametro);
      }
    });

    this.generalForm = this.fb.group({
      medicamento: [''],
      invima: [''],
      laboratorio: [''],
      lote: [''],
      fechaVencimiento: [''],
      cantidad: [''],
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

  public buscarRegistro(id: number) {
    this.ordenDespachoservicio.getOrdenDespachoId(id)
      .subscribe((resp: any) => {
        this.listaregistros = resp;
        //this.listaItemsFormula = resp.itemsDespacho;     
        this.listaItemsFormula = resp.itemsDespacho.map((item: any) => ({
          ...item,
          control: false, // O cualquier lógica que determine el estado
          //editing: false,
          cantidadDespacho: '',
        }));
        this.listaItemsFormula.sort((a: any, b: any) => a.medicamento.nombre.localeCompare(b.medicamento.nombre));
      });
  }

  async seleccionarMedicamento(event: MatAutocompleteSelectedEvent) {
    this.generalForm.get('medicamento')?.setValue(event.option.value.nombre);
    this.verItem = false;
    try {
      if (!this.listaregistros?.bodegaOrigen?.idBodega) {
        throw new Error('Bodega de origen no definida.');
      }
      const idMedicamento = event.option.value.idMedicamento;
      this.medicamentoSeleccionado = await this.existenciaActual(idMedicamento, this.listaregistros.bodegaOrigen.idBodega);

      // Validación para evitar errores de acceso a propiedades de `undefined`
      if (!this.medicamentoSeleccionado) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener la cantidad disponible en la bodega de origen.',
        });
        return;
      }

      this.itemNuevo = {
        id: idMedicamento,
        medicamento: event.option.value.nombre,
        presentacion: event.option.value.forma?.nombre || 'No especificado',
        existencia: this.medicamentoSeleccionado.cantidad || 0,
      };

      // Validación antes de asignar valores al formulario
      this.generalForm.patchValue({
        invima: this.medicamentoSeleccionado.invima || '',
        laboratorio: this.medicamentoSeleccionado.laboratorio || '',
        lote: this.medicamentoSeleccionado.lote || '',
        fechaVencimiento: this.medicamentoSeleccionado.fechaVencimiento || '',
        cantidad: '',
      });

      this.verItem = true;

    } catch (error) {
      console.error('Error al seleccionar medicamento:', error); // Depuración
      let errorMessage = 'Hubo un problema al validar el medicamento.';
      // Verificamos si `error` es una instancia de Error y tiene mensaje
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error; // Si es un string, lo usamos como mensaje
      }
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  }

  async validarYGuardarMedicamento() {
    const cantidadSolicitada = this.generalForm.get('cantidad')?.value;
    const idMedicamento = Number(this.itemNuevo.id);

  if(!this.existeItem(idMedicamento)){
    // Validación de campos requeridos
    if (!this.generalForm.get('invima')?.value ||
      !this.generalForm.get('lote')?.value ||
      !this.generalForm.get('laboratorio')?.value ||
      !this.generalForm.get('fechaVencimiento')?.value ||
      !cantidadSolicitada) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obligatorios',
        text: 'Por favor, complete todos los campos que se necesitan para agregar el item a la orden antes de continuar.',
      });
      return;
    }
  // Validación de campos requeridos
  const fechaVencimiento = this.generalForm.get('fechaVencimiento')?.value;
  const fechaIngresada = new Date(fechaVencimiento);
  const fechaHoy = new Date();
  // Normalizamos fechaHoy para que solo cuente la parte de la fecha (sin horas)
  fechaHoy.setHours(0, 0, 0, 0);

  if (fechaIngresada <= fechaHoy) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha de Vencimiento',
        text: 'La fecha de vencimiento del medicamento no puede ser anterior o igual a la fecha actual.',
      });
      return;
    }

    try {
      this.medicamentoSeleccionado = await this.existenciaActual(idMedicamento, this.listaregistros.bodegaOrigen.idBodega);
      if (!this.medicamentoSeleccionado){
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener la cantidad disponible en la bodega de origen para comparar y agregar el medicamento a la orden .',
        });
        return;
      }
      if (cantidadSolicitada > this.medicamentoSeleccionado.cantidad) {
        Swal.fire({
          icon: 'error',
          title: 'Cantidad insuficiente',
          text: `No se puede agregar el medicamento a la orden por que la cantidad existente (${this.medicamentoSeleccionado.cantidad}) es insuficiente a la cantidad solicitada (${cantidadSolicitada}) de la bodega de origen.`,
        });
        return;
      }
      // Crear el nuevo item
      let nuevoItem = new ItemOrdenDespachoI();
      nuevoItem.medicamento = idMedicamento;
      nuevoItem.cantidad = cantidadSolicitada;
      nuevoItem.invima = this.generalForm.get('invima')?.value;;
      nuevoItem.laboratorio = this.generalForm.get('laboratorio')?.value;;
      nuevoItem.lote = this.generalForm.get('lote')?.value;;
      nuevoItem.fechaVencimiento = this.generalForm.get('fechaVencimiento')?.value;;
      this.listaregistros.itemsDespacho.push(nuevoItem);

      this.ordenDespachoservicio.agregarItemAOrden(this.listaregistros.idDespacho, nuevoItem)
        .subscribe({
          next: (response) => {
            this.verItem=false;
            this.buscarRegistro(this.parametro);
            Swal.fire({
              icon: 'success',
              title: 'Medicamento agregado',
              text: `Se agregó ${cantidadSolicitada} unidad(es) del medicamento  ${this.itemNuevo.medicamento} a la orden de despacho correctamente.`,
            });
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.message,
            });
          }
        });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al validar el medicamento.',
      });
    }
  }else{
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'El medicamento ' + this.itemNuevo.medicamento + ' que esta intentando agregar, ya se encuentra en los item de la orden. por lo tanto no se puede adicionar!',
    });
  }
  }

  existenciaActual(idMedicamento: number, idBodega: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.medicamentoService.getMedicamentoBodega(idMedicamento, idBodega).subscribe(
        (existencia: any) => resolve(existencia),
        (error: any) => {
          console.error('Error al obtener existencia:', error);
          reject(error);
        }
      );
    });
  }
  existeItem(id: number): boolean {
    let existe = false;
    this.listaregistros.itemsDespacho.forEach((item: any) => {
      if (id === item.medicamento.idMedicamento) {
        existe = true;
      }
      if (id === item.medicamento) {
        existe = true;
      }
    });
    return existe;
  }

  eliminarItemOrden(idItemOrden: any) {
    if (this.tieneAcceso(3)) {
      Swal.fire({
        title: 'Desea eliminar?',
        text: 'Esta seguro de quitar el medicamento ' + idItemOrden.medicamento.nombre + ' de la orden de despacho, se devolvera al inventario de la bodega de origen ' + this.listaregistros.bodegaOrigen.nombre + ' la cantidad ' + idItemOrden.cantidad + ' que se encontraban en cange.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Si, devolver y eliminar!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.ordenDespachoservicio.regresarItemcangeBodegaorigen(this.listaregistros.idDespacho, idItemOrden.id, idItemOrden.medicamento.idMedicamento, idItemOrden.cantidad).subscribe(resp => {
            Swal.fire({
              icon: 'success',
              title: 'Ok',
              text: 'El item con el medicamento  ' + idItemOrden.medicamento.nombre + ' de la orden se ha eliminado y devuelto a la bodega de origen ' + this.listaregistros.bodegaOrigen.nombre + ' la cantidad de ' + idItemOrden.cantidad + ' correctamente! ya puede verificarlo en su existencia',
            });
            this.buscarRegistro(this.parametro);
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
    else {
      Swal.fire({
        icon: 'warning',
        title: `Falta de permisos`,
        text: "No tienes permisos para realizar la modificación en la devolución del medicamento en la orden de despacho, comunicate con el funcionario encargado!",
      });
    }
  }


  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem("nivel"));
    if (isNaN(nivelUsuario)) {
      //console.warn("El nivel del usuario no es válido o no está definido");
      return false;
    }
    return nivelUsuario >= nivelRequerido;
  }




}

