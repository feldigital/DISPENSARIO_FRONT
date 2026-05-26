import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrdendespachoService } from 'src/app/servicios/ordendespacho.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-verordendespacho',
  templateUrl: './verordendespacho.component.html',
  styleUrls: ['./verordendespacho.component.css']
})
export class VerordendespachoComponent implements OnInit {

  listaItemsFormula: any;
  listaregistros: any;
  parametro: any;
  cargando:boolean =false; 

  existencias: { [key: number]: number } = {};
  constructor(   
    private ordenDespachoservicio: OrdendespachoService,
    private activatedRoute: ActivatedRoute) { }


  ngOnInit(): void {   
    this.activatedRoute.paramMap.subscribe(params => {
      this.parametro = params.get('id');
      if (this.parametro) {
        this.buscarRegistro(this.parametro);
      }
    });   

    
  }




public buscarRegistro(id: number) {
  this.cargando = true; // Iniciamos el efecto de carga
  this.ordenDespachoservicio.getOrdenDespachoId(id)
    .subscribe({
      next: (resp: any) => {
        this.listaregistros = resp;
        
        // Mapeo y lógica de control
        this.listaItemsFormula = resp.itemsDespacho.map((item: any) => ({
          ...item,
          control: item.cantidad === item.cantidadComprobada,
          cantidadDespacho: item.cantidadComprobada,
        }));

        // Ordenamiento
        this.listaItemsFormula.sort((a: any, b: any) => 
          a.medicamento.nombre.localeCompare(b.medicamento.nombre)
        );
      },
      error: (err) => {
        console.error('Error al refrescar:', err);
        this.cargando = false; // Detenemos el spinner si hay error
      },
      complete: () => {
        // Un pequeño retraso opcional para que la animación se aprecie
        setTimeout(() => this.cargando = false, 600);
      }
    });
}

 /* public buscarRegistro(id: number) {
    this.ordenDespachoservicio.getOrdenDespachoId(id)
      .subscribe((resp: any) => {
        this.listaregistros = resp;       
        this.listaItemsFormula = resp.itemsDespacho.map((item: any) => ({
          ...item,
          // Si las cantidades son iguales, se asigna true, de lo contrario false
          control: item.cantidad === item.cantidadComprobada,
          //editing: false,
          cantidadDespacho: item.cantidadComprobada,
        }));        
        this.listaItemsFormula.sort((a: any, b: any) => a.medicamento.nombre.localeCompare(b.medicamento.nombre));
      });
  }
*/

verificarCantidad(item: any, event: any): void {
  // 1. Asignación directa del estado de control
  item.control = (item.cantidad === item.cantidadDespacho);
 console.log(item);
  // 2. Ejecutar guardado solo si la condición se cumple
  if (item.control) {
    this.ordenDespachoservicio.updateCantidadComprobadaItemOrden(item.id, item.cantidadDespacho)
      .subscribe({
        next: () => { /* Guardado silencioso exitoso */ },
        error: (err) => {
          // Si falla el guardado automático, revertimos el check para que el usuario sepa que algo no cuadró
          item.control = false;
          console.error('Fallo en guardado automático:', err);
        }
      });
  }
}


  procesarOrdenDespachoIngreso(): void {
    let funcionario = sessionStorage.getItem("nombre");
    let tieneErrores = false;
    if(!this.tieneAcceso(5)){
     tieneErrores =   this.listaItemsFormula.some((itemBodega: { cantidadDespacho: number; cantidad: number; }) => {
      if (itemBodega.cantidadDespacho != itemBodega.cantidad) {
        Swal.fire({
          icon: 'error',
          title: 'Cantidad inconsistente',
          text: 'La orden de despacho tiene items donde la cantidad a ingresar difiere de la cantidad de la orden de despacho.',
        });
        return true; // Detener la iteración si se encuentra un error
      }
      return false;
    });
}

    if (!tieneErrores) {
      Swal.fire({
        title: '¿Confirma?',
        icon: 'question',
        text: 'Agregar los medicamentos de la orden de despacho número '+ this.listaregistros.idDespacho + ' de la bodega de origen ' + this.listaregistros.bodegaOrigen.nombre + ' a la bodega destino ' + this.listaregistros.bodegaDestino.nombre,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar!'
      }).then((result) => {
        if (result.isConfirmed) {

          Swal.fire({
                title: 'Actualizando inventario..',
                html: 'Por favor espera un momento',
                allowOutsideClick: false,
                didOpen: () => {
                  Swal.showLoading();
                }
              });
      this.ordenDespachoservicio.cargarinventariocangeBodega(this.listaregistros.idDespacho, this.listaregistros.bodegaDestino.idBodega, funcionario!).subscribe(resp => {
        this.buscarRegistro(this.parametro);
        Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
        Swal.fire({
          icon: 'success',
          title: 'Ok',
          html: 'La orden de despacho ha sido cargada al inventario de la bodega de destino. satisfactoriamente',
        });
      }, err => {
         Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
        Swal.fire({
          icon: 'error',
          title: `Error`,
          text: 'No se pudo actualizar la orden de despacho al inventario de la bodega destino en la base de datos.',
        });
      });
 }
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
      return false;
    }  
    return nivelUsuario >= nivelRequerido;
  }
  
permisoBodega(): boolean {
  const bodegaActiva = Number(sessionStorage.getItem("bodega"));  
  const destino = this.listaregistros.bodegaDestino?.idBodega;
  if (destino === bodegaActiva) {    
    return true;
  }
  return false;
}



}
