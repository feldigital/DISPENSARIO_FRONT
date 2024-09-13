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

  verificarCantidad(item: any, event: any): void{
    if(item.cantidad===item.cantidadDespacho) 
      item.control=true ;
    else item.control=false;
  }

  procesarOrdenDespachoIngreso(): void {
    let funcionario = sessionStorage.getItem("nombre");
    const tieneErrores = this.listaItemsFormula.some((itemBodega: { cantidadDespacho: number; cantidad: number; }) => {
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


      this.ordenDespachoservicio.cargarinventariocangeBodega(this.listaregistros.idDespacho, this.listaregistros.bodegaDestino.idBodega, funcionario!).subscribe(resp => {
        this.buscarRegistro(this.parametro);
        Swal.fire({
          icon: 'success',
          title: 'Ok',
          html: 'La orden de despacho ha sido cargada al inventario de la bodega de destino. satisfactoriamente',
        });
      }, err => {
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

}
