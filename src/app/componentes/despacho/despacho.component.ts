import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { OrdenDespachoI } from 'src/app/modelos/ordendespacho.model';
import { ItemOrdenDespachoI } from 'src/app/modelos/ItemOrdenDespacho.model';
import { OrdendespachoService } from 'src/app/servicios/ordendespacho.service';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
//import { MedicamentoService } from 'src/app/servicios/medicamento.service';
import { Observable, debounceTime, map, of, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ProveedorComponent } from '../proveedor/proveedor.component';
import { ProveedorService } from 'src/app/servicios/proveedor.service';

@Component({
  selector: 'app-despacho',
  templateUrl: './despacho.component.html',
  styleUrls: ['./despacho.component.css']
})
export class DespachoComponent implements OnInit {

  ordenDespacho: OrdenDespachoI = new OrdenDespachoI();
  generalForm!: FormGroup;
  listaregistrosOrigen: any;
  listaregistrosDestino: any;
  registroUpdate: any;
  listaItems: any = [];
  listaItemsFiltro: any = [];
  parametro: any;
  nombrebtn!: string;
  hoy!: string;
  data: any[] = []; // Variable para almacenar los datos leídos del archivo Excel
  importar: boolean = false;
  procesar: boolean = false;
  fechaActual!: Date;
  isCompra: boolean = false;
  itemParaEliminar: any;
  proveedorFiltrados: any[] = [];
   cargando: boolean = false;



  constructor(
    private fb: FormBuilder,
    private servicio: BodegaService,
    private proveedorService: ProveedorService,
    private ordenDespachoservicio: OrdendespachoService,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.nombrebtn = "Crear orden"
  }

  ngOnInit(): void {
    this.crearFormulario();
    this.cargarRegistros();
    this.activatedRoute.paramMap.subscribe(params => {
      this.parametro = params.get('id');
      if (this.parametro) {
        this.buscarRegistro(this.parametro);
      }
    });


    this.generalForm.get('listFilter')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
        switchMap(query => this.buscarMedicamentos(query))
      )
      .subscribe(results => {
        this.listaItemsFiltro = results
      });

    this.generalForm.get('soloajuste')?.valueChanges.subscribe(valor => {
      this.onAjuste(valor); // Aquí llamas tu función manualmente
    });


    this.fechaActual = new Date();
    this.hoy = this.fechaActual.toISOString().split('T')[0];  // Formato YYYY-MM-DD


    this.generalForm.get('nomProvedor')!.valueChanges
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
        switchMap(query => this.proveedorService.filtrarProveedores(query))
      )
      .subscribe(results => {
        this.proveedorFiltrados = results;
      });

    this.generalForm.get('tipo')?.valueChanges.subscribe((tipo) => {
      this.isCompra = tipo === 'ORDEN DE COMPRA';
    });

    this.generalForm.get('tipoIngreso')?.valueChanges.subscribe(valor => {
      if (valor && valor !== 'COMPRA') {
        this.generalForm.patchValue({
          numFactura: 'NO APLICA',
          valor: 0
        });
      } else {
        // Si vuelve a COMPRA
        this.generalForm.patchValue({
          numFactura: '',
          valor: null
        });
      }
    });

  }

  public buscarRegistro(id: number) {
  this.cargando = true;
  this.ordenDespachoservicio.getOrdenDespachoId(id)
    .subscribe({
      // El "next" debe ir dentro de las llaves junto con error y complete
      next: (resp: any) => {
        this.registroUpdate = resp;
        this.ordenDespacho = resp;
        this.mostrarOrdenDespacho();
      },
      error: (err) => {
        console.error('Error al buscar el registro:', err);
        // Importante: Si usas SweetAlert2 podrías ponerlo aquí
        this.cargando = false; 
      },
      complete: () => {
        this.cargando = false;
      }
    });
}


  buscarMedicamentos(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.trim().length > 3) {
      const palabras = filterValue.toLowerCase().trim().split(/\s+/); // dividir por espacios
      const filteredResults = this.listaItems.filter((item: any) => {
        const nombre = item.nombre.toLowerCase();
        // Verificar que todas las palabras estén en el nombre
        return palabras.every(palabra => nombre.includes(palabra));
      });
      return of(filteredResults);
    }
    // Si no hay filtro, devolver la lista completa
    return of(this.listaItems);
  }


  openDialogProveedor(): void {
    const dialogRef = this.dialog.open(ProveedorComponent, {
      width: '400px',
      data: { /* puedes pasar datos iniciales aquí */ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí puedes manejar los datos devueltos, por ejemplo, seleccionar la IPS recién creada
        this.generalForm.get('nomProvedor')!.setValue(result.nombre);
      }
    });
  }


  onOptionSelectedProveedor(option: any) {
    this.generalForm.get('nomProvedor')?.setValue(option);
    this.generalForm.get('nitProvedor')?.setValue(option.nit);

  }

  displayProveedor(proveedor?: any): string {
    return proveedor ? proveedor.nombre : '';
  }


  crearFormulario() {
    this.generalForm = this.fb.group
      ({
        idDespacho: [''],
        idBodegaOrigen: [null, [Validators.required]],
        idBodegaDestino: [null, [Validators.required]],
        fechaDespacho: ['', [Validators.required]],
        observacion: ['', [Validators.required]],
        estado: [false, [Validators.required]],
        tipo: [{ value: 'ORDEN DE DESPACHO', disabled: true }],
        nitProvedor: [{ value: '', disabled: true }],
        nomProvedor: [''],
        numFactura: [''],
        valor: [''],
        tipoIngreso: [''],
        itemsDespacho: this.fb.array([]),
        listFilter: [''],
        soloajuste: [''],
        solopendiente: [''],
      });
  }
  mostrarOrdenDespacho() {
    this.nombrebtn = "Actualizar";
    this.generalForm.patchValue({
      idDespacho: this.registroUpdate.idDespacho,
      idBodegaOrigen: this.registroUpdate.bodegaOrigen,
      idBodegaDestino: this.registroUpdate.bodegaDestino,
      fechaDespacho: this.registroUpdate.fechaDespacho,
      observacion: this.registroUpdate.observacion,
      estado: this.registroUpdate.estado,
      tipo: this.registroUpdate.tipo,
      nitProvedor: this.registroUpdate.nitProvedor,
      nomProvedor: this.registroUpdate.nomProvedor,
      numFactura: this.registroUpdate.numFactura,
      valor: this.registroUpdate.valor,
      tipoIngreso: this.registroUpdate.tipoIngreso,
      itemsDespacho: this.registroUpdate.itemsDespacho,
    });
    if (this.registroUpdate.tipo === 'ORDEN DE COMPRA') {
      this.isCompra = true;
    }
    this.servicio.getMedicamentosBodegaOrdenDespacho(this.registroUpdate.bodegaOrigen.idBodega, this.registroUpdate.bodegaDestino.idBodega)
      .subscribe((resp: any) => {
        this.listaItems = resp.map((item: any) => ({
          ...item,
          estado: false, // O cualquier lógica que determine el estado
          editing: false,
          cantidadDespacho: '',
        }));
        // Iterar sobre la lista general de medicamentos
        this.listaItems.forEach((itemBodega: { idMedicamento: any; cantidadDespacho?: number }) => {
          // Buscar si el medicamento está en la orden de despacho
          const itemDespacho = this.registroUpdate.itemsDespacho.find((item: { medicamento: any; cantidad: number }) => item.medicamento.idMedicamento === itemBodega.idMedicamento);
          // Verificar si itemDespacho existe antes de acceder a sus propiedades
          if (itemDespacho) {
            // Si está en la orden de despacho, asignar la cantidad correspondiente
            itemBodega.cantidadDespacho = itemDespacho.cantidad;
          }
          //else {
          // Si no está en la orden de despacho, asignar 0
          // itemBodega.cantidadDespacho = ;
          // }
        });
        this.listaItems.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        this.listaItemsFiltro = this.listaItems
        this.generalForm.get('soloajuste')?.setValue(true);
      },
        (err: any) => { console.error(err) }
      );
    this.generalForm.get('idBodegaOrigen')?.disable();
    this.generalForm.get('idBodegaDestino')?.disable();
    //this.generalForm.get('nitProvedor')?.disable();
    //this.generalForm.get('nomProvedor')?.disable();
    //this.generalForm.get('numFactura')?.disable();
    //this.generalForm.get('valor')?.disable();
    //this.generalForm.get('soloajuste')?.setValue(true);
    this.importar = false;
    this.procesar = true;
  }

  onBodegaChange() {
    const idBodegaOrigen = this.generalForm.get('idBodegaOrigen')?.value;
    const idBodegaDestino = this.generalForm.get('idBodegaDestino')?.value;    
    this.generalForm.get('tipo')?.setValue(
      idBodegaOrigen.compra ? 'ORDEN DE COMPRA' : 'ORDEN DE DESPACHO'
    );
    if (idBodegaOrigen.idBodega === idBodegaDestino.idBodega) {
      Swal.fire({
        icon: 'error',
        title: `Bodegas iguales!`,
        text: `No se puede seleccionar la misma bodega de origen como bodega de destino!`,
      });
      return;  // Detener la ejecución si faltan las fechas
    }

    if (idBodegaOrigen && idBodegaDestino) {
      // Limpiar listas antes de cargar nueva data
      this.listaItems = [];
      this.listaItemsFiltro = [];

      // Mostrar spinner mientras carga
      Swal.fire({
        title: 'Cargando registros...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.servicio.getMedicamentosBodegaOrdenDespacho(idBodegaOrigen.idBodega, idBodegaDestino.idBodega)
        .subscribe((resp: any) => {
          this.listaItems = resp.map((item: any) => ({
            ...item,
            estado: false,
            editing: false,
            cantidadDespacho: '',
          }));
          this.listaItems.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
          this.listaItemsFiltro = this.listaItems
          this.importar = true;
          Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
        },
          (error) => {
            console.error('❌ Error cargando registros', error);
            Swal.close(); // 🚨 Primero cerramos el spinner
            Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
          }
        );
    }
  }


  cargarRegistros() {
    const bodegaActiva = Number(sessionStorage.getItem("bodega"));
    this.servicio.getRegistrosActivos()
      .subscribe((resp: any) => {
        if (this.tieneAcceso(4)) {         
          // Usuario con acceso completo
          this.listaregistrosOrigen = resp.filter((registro: any) =>
            registro.salida === true
          );
        } else {
          // Usuario con acceso restringido a su bodega
          this.listaregistrosOrigen = resp.filter((registro: any) =>
            registro.salida === true && registro.idBodega === bodegaActiva
          );
        }
        // this.listaregistrosOrigen = resp.filter((registro: any) => registro.salida === true);
        this.listaregistrosDestino = resp.filter((registro: any) => registro.entrada === true);
        this.listaregistrosOrigen.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        this.listaregistrosDestino.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
      },
        (err: any) => { console.error(err) }
      );

  }

  itemsDespachoFormArray() {
    return this.generalForm.get('itemsDespacho') as FormArray;
  }

  public editarMedicamentoOrdenDespacho(itemt: any) {
    this.listaItemsFiltro.forEach((p: any) => p.editing = false);
    itemt.editing = true;
  }

  agregarItemDespacho(item: ItemOrdenDespachoI) {
    this.itemsDespachoFormArray().push(this.fb.group({
      medicamento: [item.medicamento, Validators.required],
      cantidad: [item.cantidad, Validators.required],
      invima: [item.invima],
      laboratorio: [item.laboratorio],
      lote: [item.lote],
      fechaVencimiento: [item.fechaVencimiento]
    }));
  }

  public cancelEdicion(itemt: any) {
    itemt.editing = false;
  }


public guardarMedicamentoOrdenDespacho(itemt: any) {
  // 1. Validaciones de campos obligatorios (Blindaje inicial)
  if (!itemt.invima || !itemt.laboratorio || !itemt.lote || !itemt.fechaVencimiento) {
    Swal.fire('Campos incompletos', 'Por favor complete todos los campos, (Invima, aboratorio, lote, vencimiento).', 'warning');
    return;
  }

   const idBodegaDestino = this.generalForm.get('idBodegaDestino')?.value;

    // Validar que la fecha de vencimiento no sea menor a la fecha actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Eliminar hora para comparar solo fecha
    const fechaVenc = new Date(itemt.fechaVencimiento);
    fechaVenc.setHours(0, 0, 0, 0);

    if (fechaVenc < hoy && !idBodegaDestino.vencimiento) {
      Swal.fire('Fecha de vencimiento inválida', 'La fecha de vencimiento no puede ser menor a la fecha actual.', 'error');
      return;
    }

  // 2. Normalización de textos
  itemt.invima = itemt.invima.toUpperCase();
  itemt.laboratorio = itemt.laboratorio.toUpperCase();
  itemt.lote = itemt.lote.toUpperCase();
  itemt.editing = false;

  if (itemt && itemt.idMedicamento) {
    this.procesar = false;

    // 3. BÚSQUEDA CRÍTICA: Extraemos el ID sin importar si es objeto o número
    const itemExistente = this.ordenDespacho.itemsDespacho.find((item: any) => {
    const idEnLista = typeof item.medicamento === 'object' 
                        ? item.medicamento.idMedicamento 
                        : item.medicamento;
      return idEnLista === itemt.idMedicamento;
    });

    if (itemExistente) {
      // SI EXISTE: Reemplazamos la cantidad y los datos del lote
      // Usamos Number() para asegurar que no se concatene como texto
      itemExistente.cantidad = Number(itemt.cantidadDespacho);
      itemExistente.invima = itemt.invima;
      itemExistente.laboratorio = itemt.laboratorio;
      itemExistente.lote = itemt.lote;
      itemExistente.fechaVencimiento = itemt.fechaVencimiento;
            
    } else {
      // SI NO EXISTE: Agregamos el nuevo registro
      if (Number(itemt.cantidadDespacho) > 0) {
        let nuevoItem = new ItemOrdenDespachoI();
        nuevoItem.medicamento = itemt.idMedicamento; 
        nuevoItem.cantidad = Number(itemt.cantidadDespacho);
        nuevoItem.invima = itemt.invima;
        nuevoItem.laboratorio = itemt.laboratorio;
        nuevoItem.lote = itemt.lote;
        nuevoItem.fechaVencimiento = itemt.fechaVencimiento;
        this.ordenDespacho.itemsDespacho.push(nuevoItem);        
       }
    }
  }
}


/*
  public guardarMedicamentoOrdenDespacho(itemt: any) {
    // Validar que los campos obligatorios no estén vacíos
    if (!itemt.invima || !itemt.laboratorio || !itemt.lote || !itemt.fechaVencimiento) {
      Swal.fire('Campos incompletos', 'Por favor complete todos los campos antes de guardar.', 'warning');
      return;
    }
    const idBodegaDestino = this.generalForm.get('idBodegaDestino')?.value;
    // Validar que la fecha de vencimiento no sea menor a la fecha actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Eliminar hora para comparar solo fecha
    const fechaVenc = new Date(itemt.fechaVencimiento);
    fechaVenc.setHours(0, 0, 0, 0);
    if (fechaVenc < hoy && !idBodegaDestino.vencimiento) {
      Swal.fire('Fecha de vencimiento inválida', 'La fecha de vencimiento no puede ser menor a la fecha actual.', 'error');
      return;
    }
    // Convertir a mayúsculas
    itemt.invima = itemt.invima.toUpperCase();
    itemt.laboratorio = itemt.laboratorio.toUpperCase();
    itemt.lote = itemt.lote.toUpperCase();

    itemt.editing = false;
    if (itemt && itemt.idMedicamento) {
      this.procesar = false;
      if (this.existeItem(itemt.idMedicamento)) {
        this.actualizarCantidad(itemt.idMedicamento, itemt.cantidadDespacho);
      } else {
        if (itemt.cantidadDespacho > 0) {
          let nuevoItem = new ItemOrdenDespachoI();
          nuevoItem.medicamento = itemt.idMedicamento;
          nuevoItem.cantidad = itemt.cantidadDespacho;
          nuevoItem.invima = itemt.invima;
          nuevoItem.laboratorio = itemt.laboratorio;
          nuevoItem.lote = itemt.lote;
          nuevoItem.fechaVencimiento = itemt.fechaVencimiento;
          this.ordenDespacho.itemsDespacho.push(nuevoItem);
          //console.log(nuevoItem);
        }
      }
    } else {
      console.error('Item o idMedicamento no disponible:', itemt);
    }
  }

  existeItem(id: number): boolean {
    let existe = false;
    this.ordenDespacho.itemsDespacho.forEach((item: any) => {
      if (id === item.medicamento.idMedicamento) {
        existe = true;
      }
      if (id === item.medicamento) {
        existe = true;
      }
    });
    return existe;
  }

*/

  actualizarCantidad(id: number, nuevacantidad: number): void {
    if (nuevacantidad == 0 || nuevacantidad == null) {
      return this.eliminarItemOrdenDespacho(id);
    }
    this.ordenDespacho.itemsDespacho = this.ordenDespacho.itemsDespacho.map((item: any) => {
      const medicamentoId = typeof item.medicamento === 'object' ? item.medicamento.idMedicamento : item.medicamento;
      if (id === medicamentoId) {
        item.cantidad = nuevacantidad;
      }
      return item;
    });
  }

  eliminarItemOrdenDespacho(id: number): void {
    // Buscar el ítem que corresponde al ID recibido
    this.itemParaEliminar = this.ordenDespacho.itemsDespacho.find((item: any) => {
      const medicamentoId = typeof item.medicamento === 'object' ? item.medicamento.idMedicamento : item.medicamento;
      return id === medicamentoId;
    });

    if (!this.itemParaEliminar) {
      console.error(`No se encontró ningún ítem con el ID: ${id}`);
      return;
    }
    // Obtener el ID que se envía al backend (por ejemplo, idItem)
    const idItemBd = this.itemParaEliminar.id; // 

    // Filtrar el ítem de la lista local
    this.ordenDespacho.itemsDespacho = this.ordenDespacho.itemsDespacho.filter((item: any) => {
      const medicamentoId = typeof item.medicamento === 'object' ? item.medicamento.idMedicamento : item.medicamento;
      return id !== medicamentoId;
    });

    if (idItemBd) {

      // Llamar al servicio para eliminar el ítem en la base de datos
      this.ordenDespachoservicio.deleteItem(idItemBd).subscribe(
        (response) => {
          alert(`El ítem "${idItemBd}" ha sido eliminado correctamente.`);
        },
        (error) => {
          console.error(`Error al eliminar el ítem con ID ${idItemBd} de la base de datos:`, error);
        }
      );
    }
  }

  quitarMedicamentoDespacho(id: number): void {
    // Buscar el ítem que corresponde al ID recibido
    this.itemParaEliminar = this.ordenDespacho.itemsDespacho.find((item: any) => {
      const medicamentoId = typeof item.medicamento === 'object' ? item.medicamento.idMedicamento : item.medicamento;
      return id === medicamentoId;
    });

    if (!this.itemParaEliminar) {
      console.error(`No se encontró ningún ítem con el ID: ${id}`);
      return;
    }
    // Obtener el ID que se envía al backend (por ejemplo, idItem)
    const idItemBd = this.itemParaEliminar.id; // 

    // Filtrar el ítem de la lista local
    this.ordenDespacho.itemsDespacho = this.ordenDespacho.itemsDespacho.filter((item: any) => {
      const medicamentoId = typeof item.medicamento === 'object' ? item.medicamento.idMedicamento : item.medicamento;
      return id !== medicamentoId;
    });

    if (idItemBd) {
      // Llamar al servicio para eliminar el ítem en la base de datos
      this.ordenDespachoservicio.deleteItem(idItemBd).subscribe(
        (response) => {
          Swal.fire({
            icon: 'success',
            title: `Item eliminado!`,
            text: `El item de la orden de despacho ha sido eleiminado correctamente!`,
          });

        },
        (error) => {
          console.error(`Error al eliminar el ítem con ID ${idItemBd} de la base de datos:`, error);
        }
      );
    }
  }


  procesarOrdenDespacho(): void {
    let funcionario = sessionStorage.getItem("nombre");
    const tieneErrores = this.listaItems.some((itemBodega: { cantidadDespacho: number; cantidad: number; nombre: string; }) => {
      if (itemBodega.cantidadDespacho > itemBodega.cantidad) {
        Swal.fire({
          icon: 'error',
          title: 'Cantidad insuficiente',
          text: 'La orden tiene items donde la cantidad a despachar supera la cantidad existente en la bodega origen. ' + itemBodega.nombre + ' cantidad actual en el origen ' + itemBodega.cantidad + ' cantidad solicitada para despachar ' + itemBodega.cantidadDespacho,
        });
        return true; // Detener la iteración si se encuentra un error
      }
      return false;
    });
    if (!tieneErrores) {
      Swal.fire({
        title: '¿Confirma?',
        icon: 'question',
        text: 'Trasladar los medicamentos de la orden número ' + this.registroUpdate.idDespacho + ' del inventario de la bodega de origen ' + this.registroUpdate.bodegaOrigen.nombre + ' al estado de cange a la bodega destino ' + this.registroUpdate.bodegaDestino.nombre,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar!'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Procesando registros...',
            html: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          this.ordenDespachoservicio.descargarinventarioBodegacange(this.ordenDespacho.idDespacho, this.registroUpdate.bodegaOrigen.idBodega, funcionario!).subscribe(resp => {
            Swal.close(); // 🚨 Primero cerramos el spinner           
            this.nuevaOrdenDespacho();
            Swal.fire({
              icon: 'success',
              title: 'Ok',
              html: 'La orden ha sido descargada del inventario de la bodega de origen y los medicamentos están en <b>cange</b> para ser ingresados a la bodega destino.',
            });
          }, err => {
            Swal.close(); // 🚨 Primero cerramos el spinner
            Swal.fire({
              icon: 'error',
              title: `Error`,
              text: 'No se pudo actualizar la orden en la base de datos.',
            });
          });
        }
      });
    }
  }


  /*FUNCION DE CREACION DEL FORMULARIO*/
  create() {
    if (this.generalForm.valid) {
      if (this.ordenDespacho.itemsDespacho.length > 0) {
        const bodegaSeleccionadaOrigen = this.generalForm.get('idBodegaOrigen')?.value;
        const nitProvedor = this.generalForm.get('nitProvedor')?.value;
        const nomProvedor = this.generalForm.get('nomProvedor')?.value?.nombre;
        const numFactura = this.generalForm.get('numFactura')?.value;
        const tipoIngreso = this.generalForm.get('tipoIngreso')?.value;


        // Si la bodega es 105 (orden de compra)
        if (bodegaSeleccionadaOrigen.compra) {

          // Verifica si alguno de los campos está vacío o nulo
          if (!nitProvedor || !nomProvedor || !numFactura || !tipoIngreso) { //|| !valor
            Swal.fire({
              icon: 'error',
              title: '¡Faltan datos de la factura!',
              text: 'No se puede crear la orden de compra porque faltan los datos de la factura (proveedor, nit, factura, tipo ingreso o valor).',
            });
            return; // Detiene la ejecución del método
          }


          // 🔵 VALIDACIONES SOLO PARA COMPRA
          if (tipoIngreso === 'COMPRA') {

            const valorRaw = this.generalForm.get('valor')?.value;
            const valor = Number(valorRaw);

            if (isNaN(valor) || !isFinite(valor) || valor <= 0) {
              Swal.fire({
                icon: 'error',
                title: '¡Valor inválido!',
                text: 'El valor de la factura debe ser un numero mayor que 0.',
              });
              return;
            }
          }
        }

        const bodegaSeleccionadaDestino = this.generalForm.get('idBodegaDestino')?.value;       
        let funcionario = sessionStorage.getItem("nombre");
        let mensaje = "Bodega de origen:  <b>" + bodegaSeleccionadaOrigen.nombre + " </b> <br>"
        mensaje = mensaje + "Bodega de destino:  <b>" + bodegaSeleccionadaDestino.nombre + "</b> <br>"
        mensaje = mensaje + "Número de items de medicamentos:  <b>" + this.ordenDespacho.itemsDespacho.length + "</b>"
        let titulo = '¿Confirma crear la orden?'
        if (this.parametro != null) {
          titulo = '¿Confirma actualizar la orden?'
        }
        Swal.fire({
          title: titulo,
          icon: 'question',
          html: mensaje,
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Confirmar!'
        }).then((result) => {
          if (result.isConfirmed) {
            if (this.parametro != null) {
              this.actualizarOrdenDespacho(funcionario!); // Llama al método de actualización
            } else {
              this.crearNuevaOrdenDespacho(funcionario!); // Crea una nueva orden
            }
            this.procesar = true;
          }
        });
      }

      else {
        Swal.fire({
          icon: 'warning',
          title: 'Verificar!',
          text: 'No se ha agregado ningún medicamento a la orden que intenta guardar!',
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: "!Alerta",
        text: 'Datos incompletos para crear la orden en la base de datos!'
      });
    }
  }


  // Método para crear una nueva orden de despacho
  crearNuevaOrdenDespacho(funcionario: string) {
    Swal.fire({
      title: 'Creando la orden..',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    const idBodegaOrigen = this.generalForm.get('idBodegaOrigen')?.value;
    const idBodegaDestino = this.generalForm.get('idBodegaDestino')?.value;
    this.ordenDespacho.bodegaOrigen = idBodegaOrigen.idBodega;
    this.ordenDespacho.bodegaDestino = idBodegaDestino.idBodega;
    
    this.ordenDespacho.fechaDespacho = this.generalForm.get('fechaDespacho')?.value;
    this.ordenDespacho.observacion = this.generalForm.get('observacion')?.value;

    this.ordenDespacho.tipo = this.generalForm.get('tipo')?.value;
    this.ordenDespacho.nitProvedor = this.generalForm.get('nitProvedor')?.value;
    this.ordenDespacho.nomProvedor = this.generalForm.get('nomProvedor')?.value?.nombre;
    this.ordenDespacho.numFactura = this.generalForm.get('numFactura')?.value;
    this.ordenDespacho.valor = this.generalForm.get('valor')?.value;
    this.ordenDespacho.tipoIngreso = this.generalForm.get('tipoIngreso')?.value;

    this.ordenDespacho.funcionarioDespacho = funcionario!;
    this.ordenDespachoservicio.create(this.ordenDespacho).subscribe(resp => {

      this.generalForm.get('idBodegaOrigen')?.enable();
      this.generalForm.get('idBodegaDestino')?.enable();
      //this.generalForm.get('nitProvedor')?.enable();
      //this.generalForm.get('nomProvedor')?.enable();
      //this.generalForm.get('numFactura')?.enable();
      //this.generalForm.get('valor')?.enable();
      this.buscarRegistro(resp.idDespacho);
      Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
      this.parametro = resp.idDespacho;
      Swal.fire({
        icon: 'success',
        title: `Ok`,
        text: 'La orden ha sido agregada correctamente con el numero: ' + resp.idDespacho + ' de fecha ' + this.generalForm.get('fechaDespacho')?.value,
      });
    },
      err => {
        Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
        Swal.fire({
          icon: 'error',
          title: `Error`,
          text: `No se pudo agregar la nueva orden en la base de datos ` + err.mensaje,
        });
      });

  }
  nuevaOrdenDespacho() {
    // Resetear el formulario al estado inicial
    this.generalForm.reset({
      idDespacho: '',
      idBodegaOrigen: null,
      idBodegaDestino: null,
      fechaDespacho: '',
      observacion: '',
      nomProvedor: '',
      numFactura: '',
      nitProvedor: '',
      tipoIngreso: '',
      tipo: 'ORDEN DE DESPACHO',
      valor: '',
      estado: false,
      itemsDespacho: this.fb.array([]),
    });
    // Reiniciar la lista de ítems y la orden de despacho
    this.listaItems = [];
    this.ordenDespacho = new OrdenDespachoI();
    // Restablecer el botón a su estado inicial
    this.nombrebtn = "Crear orden";
    // Habilitar los selects de Bodega Origen y Destino
    this.generalForm.get('idBodegaOrigen')?.enable();
    this.generalForm.get('idBodegaDestino')?.enable();
    //this.generalForm.get('nitProvedor')?.enable();
    //this.generalForm.get('nomProvedor')?.enable();
    //this.generalForm.get('numFactura')?.enable();
    //this.generalForm.get('tipoIngreso')?.enable();
    //this.generalForm.get('valor')?.enable();
    // Limpiar el parámetro (si es necesario)
    this.parametro = null;
  }

  // Método para actualizar una orden de despacho existente
  actualizarOrdenDespacho(funcionario: string) {
    Swal.fire({
      title: 'Actualizando la orden..',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.ordenDespacho.fechaDespacho = this.generalForm.get('fechaDespacho')?.value;
    this.ordenDespacho.observacion = this.generalForm.get('observacion')?.value;
    //this.ordenDespacho.funcionarioDespacho = funcionario!;
    this.ordenDespachoservicio.update(this.ordenDespacho).subscribe(resp => {
      Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
      Swal.fire({
        icon: 'success',
        title: `Ok`,
        text: 'La orden ha sido actualizada correctamente.',
      });
    }, err => {
      Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
      Swal.fire({
        icon: 'error',
        title: `Error`,
        text: 'No se pudo actualizar la orden en la base de datos.',
      });
    });
  }


  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      console.error('No se puede cargar múltiples archivos');
      return;
    }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      // const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      this.data = <any[]>(XLSX.utils.sheet_to_json(ws, { header: 1 }));
      // Validar los datos
      const isValid = this.validateData(this.data);


      if (isValid) {
        // Procesar los datos si son válidos
        Swal.fire({
          icon: 'success',
          title: `OK`,
          text: 'Ya le fueron asignados las cantidades a despachar desde el archivo de excel, por favor verificar los datos antes de crear la orden de despacho!',
        });

        this.processData(this.data);
        this.generalForm.get('soloajuste')?.setValue(true);
      } else {
        Swal.fire({
          icon: 'error',
          title: `Error`,
          text: 'Hay una inconsistencia en el archivo de excel de cargue para crear la orden de despacho. Revisa los errores en la consola.',
        });

      }
      // Restablecer el input de archivo para permitir cargar nuevamente
      event.target.value = '';
    };
    reader.readAsBinaryString(target.files[0]);
  }

  // Método para validar los datos
  validateData(data: any[]): boolean {
    for (let index = 1; index < data.length; index++) {
      const row = data[index];
      // Verificar si el número de columnas es correcto
      if (row.length !== 10) {
        console.error(`Error en la fila ${index}: la cantidad de columnas es incorrecta`);
        return false; // Detener validación en el primer error
      }
      const idMedicamento = row[0];
      // Buscar el medicamento en la lista de listaItems
      const itemMedicamento = this.listaItems.find((item: { idMedicamento: any }) => item.idMedicamento === idMedicamento);
      if (!itemMedicamento) {
        console.error(`Error en la fila ${index}: El id del medicamento ${idMedicamento} no existe en la base de datos.`);
        return false; // Detener validación en el primer error
      } else {
        // Si el medicamento se encuentra, asignar un valor a un campo de ese registro
        itemMedicamento.cantidadDespacho = row[9]; // Ejemplo: asignar la cantidad de despacho de la columna 9      *
      }

      // Validar si la columna 9 es un cantidad válida para despachar
      if (isNaN(row[9])) {
        console.error(`Error en la fila ${index}: La columna 3 debe ser un número válido. Valor encontrado: ${row[9]}`);
        return false; // Detener validación en el primer error
      }
      // Puedes agregar más validaciones si es necesario
      // Validar si la columna 6 (fechaVencimiento) es una fecha válida
      const fechaVencimiento = row[8]; // Suponiendo que la columna 6 es fechaVencimiento
      if (!this.isValidDate(fechaVencimiento)) {
        console.error(`Error en la fila ${index}: La columna 'fechaVencimiento' debe ser una fecha válida. Valor encontrado: ${fechaVencimiento}`);
        return false; // Detener validación en el primer error
      }
    }
    return true; // Si todos los datos son válidos
  }

  // Método para verificar si una fecha es válida
  isValidDate(dateString: string): boolean {
    const date = Date.parse(dateString);
    if (isNaN(date)) {
      return false; // Si la fecha no es válida (es NaN)
    }
    // Compara ambos en milisegundos
    if (date <= this.fechaActual.getTime()) {
      console.log("Medicamento con fecha ya vencido o se vence hoy");
      return false; // El medicamento ya está vencido
    }
    return true; // La fecha es válida y no está vencida

  }

  // Método para procesar los datos y enviarlos a la base de datos
  processData(data: any[]) {

    const processedData = data.map(row => {
      return {
        idMedicamento: row[0],
        codigoCum: row[1],
        nombre: row[2],
        forma: row[3],
        via: row[4],
        invima: row[5],
        laboratorio: row[6],
        lote: row[7],
        fechaVencimiento: row[8], //this.formatDate(row[8]),
        cantidad: row[9],

      };
    });
    // Aquí puedes enviar processedData al backend usando un servicio de Angular

    this.saveToDatabase(processedData);
  }
  // Método para enviar los datos al backend
  saveToDatabase(data: any[]) {
    // Implementa el servicio que envía los datos al backend aquí
    for (let i = 1; i < data.length; i++) {
      let nuevoItem = new ItemOrdenDespachoI();
      nuevoItem.medicamento = data[i].idMedicamento;
      nuevoItem.cantidad = data[i].cantidad;
      nuevoItem.invima = data[i].invima;
      nuevoItem.laboratorio = data[i].laboratorio;
      nuevoItem.lote = data[i].lote;
      nuevoItem.fechaVencimiento = data[i].fechaVencimiento;
      this.ordenDespacho.itemsDespacho.push(nuevoItem);
    }
  }

  onAjuste(valor: boolean): void {
    if (valor) {
      this.listaItemsFiltro = this.listaItems.filter((registro: any) => registro.cantidadDespacho != '');
    }
    else {
      this.listaItemsFiltro = this.listaItems;
    }
  }

  onPendiente(event: any): void {
    if (event.target.checked) {
      this.listaItemsFiltro = this.listaItems.filter((registro: any) => (registro.pendiente > 0 && registro.cantidad > 0 && (registro.stopMinimo < (registro.cantidadEntregada + registro.pendiente))));
    }
    else {
      this.listaItemsFiltro = this.listaItems;
    }
  }



sugerir(): void {
  this.listaItems.forEach((itemt: any) => {
    const surtido = itemt.cantidadEntregada + itemt.pendiente;
    const proyeccion = itemt.stopMinimo - surtido;

    if (surtido > 0) {
      // Calculamos la cantidad sugerida (proyección en positivo)
      const cantidadSugerida = proyeccion * -1;

      if (proyeccion < 0 && (itemt.cantidad >= cantidadSugerida)) {
        
        // --- SUSTITUCIÓN DE existeItem ---
        // Verificamos si ya existe en la lista de despacho
        const yaExiste = this.ordenDespacho.itemsDespacho.some((item: any) => {
          const idEnLista = typeof item.medicamento === 'object' 
                            ? item.medicamento.idMedicamento 
                            : item.medicamento;
          return idEnLista === itemt.idMedicamento;
        });

        if (!yaExiste) {
          itemt.cantidadDespacho = cantidadSugerida;
          
          let nuevoItem = new ItemOrdenDespachoI();
          nuevoItem.medicamento = itemt.idMedicamento;
          nuevoItem.cantidad = cantidadSugerida;
          nuevoItem.invima = itemt.invima;
          nuevoItem.laboratorio = itemt.laboratorio;
          nuevoItem.lote = itemt.lote;
          nuevoItem.fechaVencimiento = itemt.fechaVencimiento;
          
          this.ordenDespacho.itemsDespacho.push(nuevoItem);
        }
      }
    }
  });

  this.listaItemsFiltro = [...this.listaItems]; // Clonamos para asegurar reactividad
  this.generalForm.get('soloajuste')?.setValue(true);

  Swal.fire({
    icon: 'success',
    title: 'Ok',
    text: 'Se llenaron las cantidades sugeridas a despachar hacia La bodega destino con la siguiente formula (envío= (Promedio de consumo + pendiente) - existencia actual ) siempre y cuando la cantidad en origen alcance para surtir esa proyección; por favor revisar y si estás de acuerdo crear la orden de despacho.',
  });
}
/*
  sugerir(): void {
    this.listaItems.forEach((itemt: any) => {
      const surtido = itemt.cantidadEntregada + itemt.pendiente;
      const proyeccion = itemt.stopMinimo - surtido;
      if (surtido > 0) {
        if (proyeccion < 0 && (itemt.cantidad >= (proyeccion * -1))) {
          if (!this.existeItem(itemt.idMedicamento)) {
            itemt.cantidadDespacho = proyeccion * -1;
            let nuevoItem = new ItemOrdenDespachoI();
            nuevoItem.medicamento = itemt.idMedicamento;
            nuevoItem.cantidad = proyeccion * -1;
            nuevoItem.invima = itemt.invima;
            nuevoItem.laboratorio = itemt.laboratorio;
            nuevoItem.lote = itemt.lote;
            nuevoItem.fechaVencimiento = itemt.fechaVencimiento;
            this.ordenDespacho.itemsDespacho.push(nuevoItem);
          }
        }
      }
    });
    this.listaItemsFiltro = this.listaItems;
    this.generalForm.get('soloajuste')?.setValue(true);
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: 'Se llenaron las cantidades sugeridas a despachar hacia La bodega destino con la siguiente formula (envío= (Promedio de consumo + pendiente) - existencia actual ) siempre y cuando la cantidad en origen alcance para surtir esa proyección; por favor revisar y si estás de acuerdo crear la orden de despacho.',
    });
  }
*/
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

 compararBodegas(o1: any, o2: any): boolean {
  // Si ambos son null o undefined, son iguales
  if (o1 === o2) return true;
  
  // Si uno es nulo y el otro no, no son iguales
  if (!o1 || !o2) return false;
  
  // Si ambos son objetos, comparamos sus IDs
  return o1.idBodega === o2.idBodega;
}


}
