import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { OrdenDespachoI } from 'src/app/modelos/ordendespacho.model';
import { ItemOrdenDespachoI } from 'src/app/modelos/ItemOrdenDespacho.model';
import { OrdendespachoService } from 'src/app/servicios/ordendespacho.service';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { MedicamentoService } from 'src/app/servicios/medicamento.service';
import { Observable, debounceTime, of, switchMap } from 'rxjs';

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
  importar: boolean=false;
  fechaActual!:Date;
  isCompra: boolean = false;
  itemParaEliminar:any;

  constructor(
    private fb: FormBuilder,
    private servicio: BodegaService,
    private medicamentoServicio: MedicamentoService,
    private ordenDespachoservicio: OrdendespachoService,
    private activatedRoute: ActivatedRoute
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

    this.fechaActual = new Date();
    this.hoy = this.fechaActual.toISOString().split('T')[0];  // Formato YYYY-MM-DD
    this.onTipoChange();

  }
  onTipoChange(): void {
    const tipo = this.generalForm.get('tipo')?.value;
    this.isCompra = tipo === 'ORDEN DE COMPRA';    
  }
  public buscarRegistro(id: number) {
    this.ordenDespachoservicio.getOrdenDespachoId(id)
      .subscribe((resp: any) => {
        this.registroUpdate = resp;
        this.ordenDespacho = resp;
        this.mostrarOrdenDespacho();
      });
  }


  buscarMedicamentos(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.length > 3) {
      filterValue = filterValue.toLocaleLowerCase();
      const filteredResults = this.listaItems.filter((item: any) =>
        item.nombre.toLowerCase().includes(filterValue)
      );
      return of(filteredResults);
    }
    // Retornar la lista completa si no se cumplen las condiciones
    return of(this.listaItems);
  }

  crearFormulario() {
    this.generalForm = this.fb.group
      ({
        idDespacho: [''],
        idBodegaOrigen: ['0', [Validators.required]],
        idBodegaDestino: ['0', [Validators.required]],
        fechaDespacho: ['', [Validators.required]],
        observacion: ['', [Validators.required]],       
        estado: [false, [Validators.required]],
        tipo: ['ORDEN DE DESPACHO'],
        nitProvedor: [''],
        nomProvedor: [''],
        numFactura: [''],
        valor: [''],
        itemsDespacho: this.fb.array([]),
        listFilter:[''],
      });
  }
  mostrarOrdenDespacho() {
    this.nombrebtn = "Actualizar";
    this.generalForm.patchValue({
      idDespacho: this.registroUpdate.idDespacho,
      idBodegaOrigen: this.registroUpdate.bodegaOrigen.idBodega,
      idBodegaDestino: this.registroUpdate.bodegaDestino.idBodega,
      fechaDespacho: this.registroUpdate.fechaDespacho,
      observacion: this.registroUpdate.observacion,
      estado: this.registroUpdate.estado,
      tipo: this.registroUpdate.tipo,
      nitProvedor: this.registroUpdate.nitProvedor,
      nomProvedor: this.registroUpdate.nomProvedor,
      numFactura: this.registroUpdate.numFactura,
      valor: this.registroUpdate.valor,
      itemsDespacho: this.registroUpdate.itemsDespacho,
    });
    if(this.registroUpdate.tipo === 'ORDEN DE COMPRA')
      {
        this.isCompra =true;
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
        this.listaItemsFiltro=this.listaItems
      },
        (err: any) => { console.error(err) }
      );
    this.generalForm.get('idBodegaOrigen')?.disable();
    this.generalForm.get('idBodegaDestino')?.disable();
    this.generalForm.get('nitProvedor')?.disable();
    this.generalForm.get('nomProvedor')?.disable();
    this.generalForm.get('numFactura')?.disable();
    this.generalForm.get('valor')?.disable();
    
  }

  onBodegaChange() {
    const idBodegaOrigen = this.generalForm.get('idBodegaOrigen')?.value;
    const idBodegaDestino = this.generalForm.get('idBodegaDestino')?.value;   
    if (idBodegaOrigen===idBodegaDestino) {
      Swal.fire({
        icon: 'error',
        title: `Bodegas iguales!`,
        text: `No se puede seleccionar la misma bodega de origen como bodega de destino!`,
      });
      return;  // Detener la ejecución si faltan las fechas
    }

    this.servicio.getMedicamentosBodegaOrdenDespacho(idBodegaOrigen, idBodegaDestino)
      .subscribe((resp: any) => {      
        this.listaItems = resp.map((item: any) => ({         
          ...item,
          estado: false,
          editing: false,
          cantidadDespacho: '',
        }));
        this.listaItems.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        this.listaItemsFiltro=this.listaItems

        this.importar=true;
      },
        (err: any) => { console.error(err) }
      );

  }


  cargarRegistros() {
    this.servicio.getRegistrosActivos()
      .subscribe((resp: any) => {
       // this.listaregistros = resp
        this.listaregistrosOrigen = resp.filter((registro: any) => registro.salida === true);
        this.listaregistrosDestino = resp.filter((registro: any) => registro.entrada === true);
        this.listaregistrosOrigen.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));//sort((a: any, b: any) => b.nombre - a.nombre);
      },
        (err: any) => { console.error(err) }
      );

  }

  itemsDespachoFormArray() {
    return this.generalForm.get('itemsDespacho') as FormArray;
  }

  public editarMedicamentoOrdenDespacho(itemt: any) {
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
    itemt.editing = false;   
    if (itemt && itemt.idMedicamento) {
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
    const tieneErrores = this.listaItems.some((itemBodega: { cantidadDespacho: number; cantidad: number; }) => {
      if (itemBodega.cantidadDespacho > itemBodega.cantidad) {
       
        Swal.fire({
          icon: 'error',
          title: 'Cantidad insuficiente',
          text: 'La orden tiene items donde la cantidad a despachar supera la cantidad existente en la bodega origen.',
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


          this.ordenDespachoservicio.descargarinventarioBodegacange(this.ordenDespacho.idDespacho, this.registroUpdate.bodegaOrigen.idBodega, funcionario!).subscribe(resp => {
            this.nuevaOrdenDespacho();
            Swal.fire({
              icon: 'success',
              title: 'Ok',
              html: 'La orden ha sido descargada del inventario de la bodega de origen y los medicamentos están en <b>cange</b> para ser ingresados a la bodega destino.',
            });
          }, err => {
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
        const idBodegaOrigen = this.generalForm.get('idBodegaOrigen')?.value;
        const bodegaSeleccionadaOrigen = this.listaregistrosOrigen.find((item: { idBodega: any; }) => item.idBodega === idBodegaOrigen);
        const idBodegaDestino = this.generalForm.get('idBodegaDestino')?.value;
        // Encuentra el objeto en `listaregistros` que tiene el id igual a `idBodegaDestino`
        const bodegaSeleccionadaDestino = this.listaregistrosDestino.find((item: { idBodega: any; }) => item.idBodega === idBodegaDestino);
       
        let funcionario = sessionStorage.getItem("nombre");
        let mensaje = "Bodega de origen:  <b>" + bodegaSeleccionadaOrigen.nombre + " </b> <br>"
        mensaje = mensaje + "Bodega de destino:  <b>" + bodegaSeleccionadaDestino.nombre + "</b> <br>"
        mensaje = mensaje + "Número de items de medicamentos:  <b>" + this.ordenDespacho.itemsDespacho.length + "</b>"
        let titulo='¿Confirma crear la orden?'
        if (this.parametro!=null) {
          titulo='¿Confirma actualizar la orden?'
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
            if (this.parametro!=null) {
              this.actualizarOrdenDespacho(funcionario!); // Llama al método de actualización
            } else {
              this.crearNuevaOrdenDespacho(funcionario!); // Crea una nueva orden
            }

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
    this.ordenDespacho.bodegaOrigen = this.generalForm.get('idBodegaOrigen')?.value;
    this.ordenDespacho.bodegaDestino = this.generalForm.get('idBodegaDestino')?.value;
    this.ordenDespacho.fechaDespacho = this.generalForm.get('fechaDespacho')?.value;
    this.ordenDespacho.observacion = this.generalForm.get('observacion')?.value;

    this.ordenDespacho.tipo = this.generalForm.get('tipo')?.value;
    this.ordenDespacho.nitProvedor = this.generalForm.get('nitProvedor')?.value;
    this.ordenDespacho.nomProvedor = this.generalForm.get('nomProvedor')?.value;
    this.ordenDespacho.numFactura = this.generalForm.get('numFactura')?.value;
    this.ordenDespacho.valor = this.generalForm.get('valor')?.value;

    this.ordenDespacho.funcionarioDespacho = funcionario!;
    this.ordenDespachoservicio.create(this.ordenDespacho).subscribe(resp => {
      this.buscarRegistro(resp.idDespacho);
      this.generalForm.get('idBodegaOrigen')?.enable();
      this.generalForm.get('idBodegaDestino')?.enable();
      this.generalForm.get('nitProvedor')?.enable();
      this.generalForm.get('nomProvedor')?.enable();
      this.generalForm.get('numFactura')?.enable();
      this.generalForm.get('valor')?.enable();
      this.buscarRegistro(resp.idDespacho);
      this.parametro = resp.idDespacho;
      Swal.fire({
        icon: 'success',
        title: `Ok`,
        text: 'La orden ha sido agregada correctamente con el numero: ' + resp.idDespacho + ' de fecha ' + this.generalForm.get('fechaDespacho')?.value,
      });
    },
      err => {
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
      idBodegaOrigen: '',
      idBodegaDestino: '',
      fechaDespacho: '',
      observacion: '',
      nomProvedor: '',
      numFactura: '',
      nitProvedor: '',
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
    this.generalForm.get('nitProvedor')?.enable();
    this.generalForm.get('nomProvedor')?.enable();
    this.generalForm.get('numFactura')?.enable();
    this.generalForm.get('valor')?.enable();
    // Limpiar el parámetro (si es necesario)
    this.parametro = null;
  }

  // Método para actualizar una orden de despacho existente
  actualizarOrdenDespacho(funcionario: string) {
    this.ordenDespacho.fechaDespacho = this.generalForm.get('fechaDespacho')?.value;
    this.ordenDespacho.observacion = this.generalForm.get('observacion')?.value;
    this.ordenDespacho.funcionarioDespacho = funcionario!;
    this.ordenDespachoservicio.update(this.ordenDespacho).subscribe(resp => {
      Swal.fire({
        icon: 'success',
        title: `Ok`,
        text: 'La orden ha sido actualizada correctamente.',
      });
    }, err => {
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
      console.error(`Error en la fila ${index }: la cantidad de columnas es incorrecta`);
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
      console.error(`Error en la fila ${index }: La columna 3 debe ser un número válido. Valor encontrado: ${row[9]}`);
      return false; // Detener validación en el primer error
    }
    // Puedes agregar más validaciones si es necesario
// Validar si la columna 6 (fechaVencimiento) es una fecha válida
const fechaVencimiento = row[8]; // Suponiendo que la columna 6 es fechaVencimiento
if (!this.isValidDate(fechaVencimiento)) {
  console.error(`Error en la fila ${index }: La columna 'fechaVencimiento' debe ser una fecha válida. Valor encontrado: ${fechaVencimiento}`);
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


  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}
