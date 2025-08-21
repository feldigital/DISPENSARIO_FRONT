import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { Observable, debounceTime, of, switchMap } from 'rxjs';
import { AjusteInventarioI } from 'src/app/modelos/ajusteinventario.model';
import { ItemAjusteInventarioI } from 'src/app/modelos/itemajusteinventario.model';
import { AjusteinventarioService } from 'src/app/servicios/ajusteinventario.service';

@Component({
  selector: 'app-ajusteinventario',
  templateUrl: './ajusteinventario.component.html',
  styleUrls: ['./ajusteinventario.component.css']
})
export class AjusteinventarioComponent {

  ajusteInventario: AjusteInventarioI = new AjusteInventarioI();
  generalForm!: FormGroup;
  listaregistrosBodega: any; 
  registroUpdate: any;
  listaItems: any = [];
  listaItemsFiltro: any = [];
  parametro: any;
  nombrebtn!: string;
  hoy!: string;
  data: any[] = []; // Variable para almacenar los datos leídos del archivo Excel
  importar: boolean=false;
  fechaActual!:Date;
  itemParaEliminar:any;
  smserror:string ="";

  constructor(
    private fb: FormBuilder,
    private servicio: BodegaService,
    private ajustarInventarioServicio: AjusteinventarioService,   
    private activatedRoute: ActivatedRoute
  ) {
    this.nombrebtn = "Crear ajuste"
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


  }
 
  public buscarRegistro(id: number) {
    this.ajustarInventarioServicio.getAjusteInventarioId(id)
      .subscribe((resp: any) => {
        this.registroUpdate = resp;
        this.ajusteInventario = resp;
        this.mostrarAjusteInventario();
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
  



  crearFormulario() {
    this.generalForm = this.fb.group
      ({
        idAjuste: [''],
        bodegaAjuste: ['0', [Validators.required]],
        fechaAjuste: ['', [Validators.required]],
        observacionAjuste: ['', [Validators.required]],      
        fechaInventario: ['', [Validators.required]],
        funcionarioInventario: [''],        
        itemsAjuste: this.fb.array([]),
        listFilter:[''],
        soloajuste:[''],
      });
  }

  mostrarAjusteInventario() {
    this.nombrebtn = "Actualizar ajuste";
    this.generalForm.patchValue({
      idAjuste: this.registroUpdate.idAjuste,
      bodegaAjuste: this.registroUpdate.bodegaAjuste.idBodega,    
      fechaAjuste: this.registroUpdate.fechaAjuste,
      fechaInventario: this.registroUpdate.fechaInventario,
      observacionAjuste: this.registroUpdate.observacionAjuste,     
      funcionarioInventario: this.registroUpdate.funcionarioInventario,     
      itemsAjuste: this.registroUpdate.itemsAjuste,
    });
   
    this.servicio.getRegistrosMedicamentoBodega(this.registroUpdate.bodegaAjuste.idBodega)
      .subscribe((resp: any) => {
        this.listaItems = resp.map((item: any) => ({
          ...item,
          estado: false, // O cualquier lógica que determine el estado
          editing: false,
          cantidadAjuste: '',
          cantidadFisica: '',
          cantidadSistema: '',
        }));
        // Iterar sobre la lista general de medicamentos
        this.listaItems.forEach((itemBodega: { idMedicamento: any; cantidadAjuste?: number; cantidadFisica?: number; cantidadSistema?: number }) => {
          // Buscar si el medicamento está en la orden de despacho
          const itemAjuste = this.registroUpdate.itemsAjuste.find((item: { medicamento: any; cantidad: number }) => item.medicamento.idMedicamento === itemBodega.idMedicamento);
          // Verificar si itemDespacho existe antes de acceder a sus propiedades
          if (itemAjuste) {
            // Si está en la orden de despacho, asignar la cantidad correspondiente
            itemBodega.cantidadAjuste = itemAjuste.cantidadAjuste;
            itemBodega.cantidadFisica = itemAjuste.cantidadFisica;
            itemBodega.cantidadSistema = itemAjuste.cantidadSistema;
          }
          //else {
          // Si no está en la orden de despacho, asignar 0
          // itemBodega.cantidadDespacho = ;
          // }
        });
        this.listaItems.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        this.listaItemsFiltro= this.listaItems.filter((registro: any) => registro.cantidadAjuste !='');  
        this.generalForm.get('soloajuste')?.patchValue(true);

      },
        (err: any) => { console.error(err) }
      );
    this.generalForm.get('bodegaAjuste')?.disable();
  
    
  }

  onBodegaChange() {
    const idBodega = this.generalForm.get('bodegaAjuste')?.value;
    
         Swal.fire({
              title: 'Cargando registros...',
              html: 'Por favor espera un momento',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });
    this.servicio.getRegistrosMedicamentoBodega(idBodega)
      .subscribe((resp: any) => {      
        this.listaItems = resp.map((item: any) => ({         
          ...item,
          estado: false,
          editing: false,
          cantidadAjuste:  '',
          cantidadFisica:  '',
          cantidadSistema: '',
        }));
        this.listaItems.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        this.listaItemsFiltro=this.listaItems;
        this.importar=true;
        Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
                },
                (error) => {
                  console.error('❌ Error cargando registros', error);
                  Swal.close(); // 🚨 Primero cerramos el spinner
                  Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
                }
              );       

  }


  cargarRegistros() {
    this.servicio.getRegistrosActivos()
      .subscribe((resp: any) => {
       // this.listaregistros = resp
        this.listaregistrosBodega = resp.filter((registro: any) => registro.salida === true);       
        this.listaregistrosBodega.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
      },
        (err: any) => { console.error(err) }
      );

  }

  itemsDespachoFormArray() {
    return this.generalForm.get('itemsAjuste') as FormArray;
  }

  public editarMedicamentoAjusteInventario(itemt: any) {
    itemt.editing = true;
  }

  agregarItemAjusteInventario(item: ItemAjusteInventarioI) {
    this.itemsDespachoFormArray().push(this.fb.group({
      medicamento: [item.medicamento, Validators.required],
      cantidadAjuste: [item.cantidadAjuste, Validators.required],
      cantidadFisica: [item.cantidadFisica, Validators.required],
      cantidadSistema: [item.cantidadSistema, Validators.required],      
    }));
  }
 
  public cancelEdicion(itemt: any) {
    itemt.editing = false;   
  }

  public guardarMedicamentoAjusteInventario(itemt: any) {
    console.log(itemt);
    itemt.editing = false;   
    if (itemt && itemt.idMedicamento) {
       if (this.existeItem(itemt.idMedicamento)) {       
        this.actualizarCantidad(itemt.idMedicamento, itemt.cantidadAjuste);
      } else {   
       // if (itemt.cantidadAjuste > 0) {
          let nuevoItem = new ItemAjusteInventarioI();
          nuevoItem.medicamento = itemt.idMedicamento;
          nuevoItem.cantidadAjuste = itemt.cantidadAjuste;
          nuevoItem.cantidadFisica = itemt.cantidadFisica;
          nuevoItem.cantidadSistema = itemt.cantidadSistema;          
          this.ajusteInventario.itemsAjuste.push(nuevoItem);          
        //}
      }
    } else {
      console.error('Item o idMedicamento no disponible:', itemt);
    }
  }

  existeItem(id: number): boolean {
    let existe = false;   
    this.ajusteInventario.itemsAjuste.forEach((item: any) => {  
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
      return this.eliminarItemAjusteInventario(id);
    }
    this.ajusteInventario.itemsAjuste = this.ajusteInventario.itemsAjuste.map((item: any) => {
      if (item.medicamento.idMedicamento === id) {
        return { ...item, cantidad: nuevacantidad };
      }
      return item;
    });
  }

  eliminarItemAjusteInventario(id: number): void {   
    this.itemParaEliminar = this.ajusteInventario.itemsAjuste.find(
      (item: any) => item.medicamento.idMedicamento === id
    );
  
    if (!this.itemParaEliminar) {
      console.error(`No se encontró ningún ítem con el ID: ${id}`);
      return;
    }
     // Obtener el ID que se envía al backend (por ejemplo, idItem)
    const idItemBd = this.itemParaEliminar.idItem; // 

    this.ajusteInventario.itemsAjuste = this.ajusteInventario.itemsAjuste.filter(
      (item: any) => item.medicamento.idMedicamento !== id
    );
   
  if (idItemBd) {

  // Llamar al servicio para eliminar el ítem en la base de datos
  this.ajustarInventarioServicio.deleteItem(idItemBd).subscribe(
    (response) => {  
      alert(`El ítem "${idItemBd}" ha sido eliminado correctamente.`);  
    },
    (error) => {
      console.error(`Error al eliminar el ítem con ID ${idItemBd} de la base de datos:`, error);
    }
  );
}
  }

  quitarMedicamentoAjusteInventario(id: number): void {
  
    this.itemParaEliminar = this.ajusteInventario.itemsAjuste.find(
      (item: any) => item.medicamento.idMedicamento === id
    );
  
    if (!this.itemParaEliminar) {
      console.error(`No se encontró ningún ítem con el ID: ${id}`);
      return;
    }
     // Obtener el ID que se envía al backend (por ejemplo, idItem)
    const idItemBd = this.itemParaEliminar.idItem; // 

    this.ajusteInventario.itemsAjuste = this.ajusteInventario.itemsAjuste.filter(
      (item: any) => item.medicamento.idMedicamento !== id
    );
   
    if (idItemBd) {
  
    // Llamar al servicio para eliminar el ítem en la base de datos
    this.ajustarInventarioServicio.deleteItem(idItemBd).subscribe(
      (response) => {      
        Swal.fire({
          icon: 'success',
          title: `Item eliminado!`,
          text: `El item de la orden de ajuste de Inventario ha sido eleiminado correctamente!`,
        });        
      },
      (error) => {
        console.error(`Error al eliminar el ítem con ID ${idItemBd} de la base de datos:`, error);
      }
    );  
  }  
    }  


  procesarAjusteInventario(): void {
    let funcionario = sessionStorage.getItem("nombre");

    const tieneErrores = this.listaItems.some((itemAjuste: { cantidadAjuste: number; cantidad: number; }) => {

      const cantidad = Number(itemAjuste.cantidad) || 0;
      const cantidadAjuste = Number(itemAjuste.cantidadAjuste) || 0;
      const diferencia = cantidad + cantidadAjuste; // Aquí calculamos la diferencia correctamente
    
      if (diferencia < 0) {
        console.log("Cantidad actual:", cantidad, "| Ajuste:", cantidadAjuste);
        console.log("Diferencia calculada:", diferencia);
     
         Swal.fire({
          icon: 'error',
          title: 'Cantidad insuficiente',
          text: 'La orden de ajuste tiene items donde la cantidad a ajustar generaria un valor negativo e las existencias de la bodega que quiere ajustar.',
        });
        return true; // Detener la iteración si se encuentra un error
      }    
      return false;
    });

    if (!tieneErrores) {
      Swal.fire({
        title: '¿Confirma?',
        icon: 'question',
        text: 'Ajustar las cantidades de los medicamentos de la orden de ajuste de inventario número ' + this.registroUpdate.idAjuste + ' a la bodega ' + this.registroUpdate.bodegaAjuste.nombre ,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar!'
      }).then((result) => {
        if (result.isConfirmed) {


          this.ajustarInventarioServicio.ajustarInventarioBodega(this.ajusteInventario.idAjuste, this.registroUpdate.bodegaAjuste.idBodega, funcionario!).subscribe(resp => {
            this.nuevaAjusteInventario();
            Swal.fire({
              icon: 'success',
              title: 'Ok',
              html: 'Las cantidades de los medicamentos en la orden de ajuste seleccionada se han aplicado correctamente.',
            });
          }, err => {
            Swal.fire({
              icon: 'error',
              title: `Error`,
              text: 'No se pudo ajustar el inventario en la base de datos.',
            });
          });

        }
      });

    }
  }


  
  create() {
    if (this.generalForm.valid) {      
      if (this.ajusteInventario.itemsAjuste.length > 0) {
        const idBodega = this.generalForm.get('bodegaAjuste')?.value;
        const bodegaSeleccionada = this.listaregistrosBodega.find((item: { idBodega: any; }) => item.idBodega === idBodega);
        
        let funcionario = sessionStorage.getItem("nombre");
        let mensaje = "Bodega a ajustar:  <b>" + bodegaSeleccionada.nombre + " </b> <br>"
      
        mensaje = mensaje + "Número de items de medicamentos que se afectaran en sus existencias:  <b>" + this.ajusteInventario.itemsAjuste.length + "</b>"
        let titulo='¿Confirma crear la orden de ajuste de inventario?'
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
              this.actualizarAjusteInventario(funcionario!); // Llama al método de actualización
            } else {
              this.crearNuevaAjusteInventario(funcionario!); // Crea una nueva orden
            }

          }
        });
      }

      else {
        Swal.fire({
          icon: 'warning',
          title: 'Verificar!',
          text: 'No se ha agregado ningún medicamento a la orden de ajuste de inventario que intenta guardar!',
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: "!Alerta",
        text: 'Datos incompletos para crear la orden de ajuste de inventario en la base de datos!'
      });
    }
  }


  // Método para crear una nueva orden de despacho
  crearNuevaAjusteInventario(funcionario: string) {
    this.ajusteInventario.bodegaAjuste = this.generalForm.get('bodegaAjuste')?.value;    
    this.ajusteInventario.fechaAjuste = this.generalForm.get('fechaAjuste')?.value;
    this.ajusteInventario.funcionarioAjuste = funcionario!;
    this.ajusteInventario.observacionAjuste = this.generalForm.get('observacionAjuste')?.value;
    this.ajusteInventario.fechaInventario = this.generalForm.get('fechaInventario')?.value;
    this.ajusteInventario.funcionarioInventario = this.generalForm.get('funcionarioInventario')?.value;
    
    this.ajustarInventarioServicio.create(this.ajusteInventario).subscribe(resp => {
      this.buscarRegistro(resp.idAjuste);
      this.generalForm.get('bodegaAjuste')?.enable();
      //this.buscarRegistro(resp.idAjuste);
      this.parametro = resp.idAjuste;
      Swal.fire({
        icon: 'success',
        title: `Ok`,
        text: 'La orden de ajuste de inventario ha sido creada correctamente con el numero: ' + resp.idAjuste + ' de fecha ' + this.generalForm.get('fechaAjuste')?.value + ' y afectara '+ this.ajusteInventario.itemsAjuste.length + 'medicamentos de la bodega seleccionada',
      });
    },
      err => {
        Swal.fire({
          icon: 'error',
          title: `Error`,
          text: `No se pudo agregar la nueva orden de Ajuste de Inventario en la base de datos ` + err.mensaje,
        });
      });

  }
  nuevaAjusteInventario() {
    // Resetear el formulario al estado inicial
    this.generalForm.reset({
      idAjuste: '',
      bodegaAjuste: '',
      fechaAjuste: '',
      observacionAjuste: '',
      fechaInventario: '',
      funcionarioInventario: '',       
      itemsDespacho: this.fb.array([]),
    });
    // Reiniciar la lista de ítems y la orden de despacho
    this.listaItems = [];
    this.ajusteInventario = new AjusteInventarioI();
    // Restablecer el botón a su estado inicial
    this.nombrebtn = "Crear ajuste"; 
    this.generalForm.get('bodegaAjuste')?.enable();    
    this.parametro = null;
  }

  // Método para actualizar una orden de despacho existente
  actualizarAjusteInventario(funcionario: string) {
    this.ajusteInventario.fechaAjuste = this.generalForm.get('fechaAjuste')?.value;    
    this.ajusteInventario.observacionAjuste = this.generalForm.get('observacionAjuste')?.value;
    this.ajusteInventario.fechaInventario = this.generalForm.get('fechaInventario')?.value;   
    this.ajusteInventario.funcionarioInventario = this.generalForm.get('funcionarioInventario')?.value;  
    //this.ajusteInventario.funcionarioAjuste = funcionario!;

    this.ajustarInventarioServicio.update(this.ajusteInventario).subscribe(resp => {
      Swal.fire({
        icon: 'success',
        title: `Ok`,
        text: 'La orden de ajuste de inventario ha sido actualizada correctamente.',
      });
    }, err => {
      Swal.fire({
        icon: 'error',
        title: `Error`,
        text: 'No se pudo actualizar la orden de ajuste de inventario en la base de datos.',
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
        text: 'Ya le fueron asignados las cantidades a ajustar desde el archivo de excel, por favor verificar los datos antes de crear la orden de ajuste!',
      });
     
      this.processData(this.data);
    } else {

      Swal.fire({
        icon: 'error',
        title: `Error`,
        text: 'Hay una inconsistencia en el archivo de excel de cargue para crear la orden de ajuste de inventario; '+ this.smserror,
      });
      
    }
     // Restablecer el input de archivo para permitir cargar nuevamente
     event.target.value = '';
  };
  reader.readAsBinaryString(target.files[0]);
  }

 // Método para validar los datos
validateData(data: any[]): boolean {
  this.smserror="";
  for (let index = 1; index < data.length; index++) {
    const row = data[index];
    // Verificar si el número de columnas es correcto
    if (row.length !== 8) {
      this.smserror=`Error en la fila número ${index } del archivo, la cantidad de columnas es incorrecta`;
      return false; // Detener validación en el primer error
    }
    const idMedicamento = row[2];   
    // Buscar el medicamento en la lista de listaItems
    const itemMedicamento = this.listaItems.find((item: { idMedicamento: any }) => item.idMedicamento === idMedicamento);
    if (!itemMedicamento) {
      this.smserror=`Error en la fila número ${index} del archivo, el id del medicamento ${idMedicamento} no existe en la base de datos de esa bodega.`;
      return false; // Detener validación en el primer error
    } else {
      // Si el medicamento se encuentra, asignar un valor a un campo de ese registro
      itemMedicamento.cantidadAjuste = row[7]; // Ejemplo: asignar la cantidad de despacho de la columna 9      *
      itemMedicamento.cantidadFisica = row[6]; // Ejemplo: asignar la cantidad de despacho de la columna 9      *
      itemMedicamento.cantidadSistema = row[5]; // Ejemplo: asignar la cantidad de despacho de la columna 9      *
    } 

   // Validar si las columnas 6, 7 y 8 contienen valores numéricos
if ([row[5], row[6], row[7]].some(value => Number.isNaN(Number(value)))) {
   this.smserror=`Error en la fila número ${index} del archivo, las columnas 6, 7 y 8 deben contener números válidos. Valores encontrados: [${row[5]}, ${row[6]}, ${row[7]}]`;
  return false;
}

// Validar si la columna 8 (ajuste) es 0
if (Number(row[7]) === 0) {
  this.smserror=`Error en la fila número ${index} del archivo, la columna de ajuste (8) no puede ser 0, significa que no necesita ser ajustada`;
  return false;
}

// Validar si la columna de ajuste es diferente a la diferencia entre existencia física y existencia en el sistema
const diferencia = Number(row[6]) - Number(row[5]);
if (Number(row[7]) !== diferencia) {
  this.smserror=`Error en la fila número ${index} del archivo, el valor de ajuste (columna 8) no coincide con la diferencia entre la existencia física (columna 7: ${row[6]}) y la existencia en el sistema (columna 6: ${row[5]}). Se esperaba: ${diferencia}, pero se encontró: ${row[7]}`;
  return false;
}

  }
  return true; // Si todos los datos son válidos
}


// Método para procesar los datos y enviarlos a la base de datos
  processData(data: any[]) {  
    const processedData = data.map(row => {
      return {
        idMedicamento: row[2],
        cantidadAjuste: row[7],
        cantidadFisica: row[6],       
        cantidadSistema: row[5],
       
      };
    });
    // Aquí puedes enviar processedData al backend usando un servicio de Angular
  
    this.saveToDatabase(processedData);
  }
  // Método para enviar los datos al backend
  saveToDatabase(data: any[]) {
    // Implementa el servicio que envía los datos al backend aquí
    for (let i = 1; i < data.length; i++) {
    let nuevoItem = new ItemAjusteInventarioI();
    nuevoItem.medicamento = data[i].idMedicamento;
    nuevoItem.cantidadAjuste = data[i].cantidadAjuste;        
    nuevoItem.cantidadFisica = data[i].cantidadFisica;        
    nuevoItem.cantidadSistema = data[i].cantidadSistema;        
    this.ajusteInventario.itemsAjuste.push(nuevoItem);
    }
  }


  onAjuste(event: any): void {
   
    if(event.target.checked){   
    this.listaItemsFiltro = this.listaItems.filter((registro: any) => registro.cantidadAjuste !='');  
    }
    else {
      this.listaItemsFiltro = this.listaItems
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

    reporteEnConstruccion() {
      Swal.fire({
        icon: 'info',
        title: `En construcción!`,
        text: `El reporte esta en proceso de construcción, te estaremos informando cuando esté disponible!`,
      });
    }

}
