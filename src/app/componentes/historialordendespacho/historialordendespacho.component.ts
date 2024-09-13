import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { OrdendespachoService } from 'src/app/servicios/ordendespacho.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-historialordendespacho',
  templateUrl: './historialordendespacho.component.html',
  styleUrls: ['./historialordendespacho.component.css']
})
export class HistorialordendespachoComponent {

  listaOrdendespacho: any; 
  listaregistros: any; 
  listaItemOrden: any;
  consultaSeleccionada: string = '';
  generalForm!: FormGroup;
  idBodegaSeleccionada: string = '';
  contador: number=0;

  constructor(  
    private fb: FormBuilder,
    private ordendespachoservicio: OrdendespachoService,
    private bodegaservicio: BodegaService,
  ) { 
    this.crearFormulario();
    this. cargarRegistros();

  }

  ngOnInit(): void {   
  }

  crearFormulario() {
    this.generalForm = this.fb.group
      ({        
        idBodega: [''],
        tipoConsulta: ['todas'],        
      });
  }

  cargarRegistros() {
    this.bodegaservicio.getRegistrosActivos()
      .subscribe((resp: any) => {
        this.listaregistros = resp
        this.listaregistros.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
      },
        (err: any) => { console.error(err) }
      );
      }
  

  onBodegaChange(event: any) {
    const bodegaId = this.generalForm.get('idBodega')?.value;
    this.idBodegaSeleccionada= bodegaId;
    const tipoConsulta = this.generalForm.get('tipoConsulta')?.value;  
    if (bodegaId && tipoConsulta) {     
      if (tipoConsulta === 'origen') {
        this.consultarOrdenesPorBodegaOrigen(bodegaId);
      } else if (tipoConsulta === 'destino') {
        this.consultarOrdenesPorBodegaDestino(bodegaId);
      } else if (tipoConsulta === 'todas') {
        this.consultarTodasOrdenesPorBodega(bodegaId);
      }
    }
  }

  consultarOrdenesPorBodegaOrigen(bodegaId: number) {
    this.ordendespachoservicio.getOrdenDespachoBodegaOrigen(bodegaId)
      .subscribe(resp => {
        this.listaOrdendespacho = resp;
        console.log('Ordenes de despacho de salida:', this.listaOrdendespacho);
      });
  }
  
  consultarOrdenesPorBodegaDestino(bodegaId: number) {
    this.ordendespachoservicio.getOrdenDespachoBodegaDestino(bodegaId)
      .subscribe(resp => {
        this.listaOrdendespacho = resp;
        console.log('Ordenes de despacho de entrada:', this.listaOrdendespacho);
      });
  }
  
  consultarTodasOrdenesPorBodega(bodegaId: number) { 
    this.ordendespachoservicio.getOrdenDespachoBodegaTodas(bodegaId)
      .subscribe(resp => {
        this.listaOrdendespacho = resp;
        console.log('Todas las ordenes de despacho:', this.listaOrdendespacho);
      });
  }


  public eliminarOrdenDespacho(itemt: any) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `La orden de despacho Nro. ` + itemt.idDespacho  + ` dirijida a la bodega ` + itemt.bodegaDestino.nombre+ ` de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ordendespachoservicio.delete(itemt.idDespacho).subscribe(resp => {
          this.listaOrdendespacho = this.listaOrdendespacho.filter((cli: any) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La orden de despacho número `+ itemt.idDespacho + ` dirigida a la bodega ` + itemt.bodegaDestino.nombre + ` ha sido eliminado correctamente.`,
          });
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

  reporteOrdenDespacho(orden: any, incluirCantidad: boolean): void { 
    console.log(orden); 
    const doc = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'letter',
      putOnlyUsedFonts: true
    });
    let totalPagesExp = '{total_pages_count_string}';
    let paginaActual = 1;

  // Captura el contexto actual de la clase
  const self = this;

   // Cabecera dinámica, dependiendo si se incluye la cantidad o no
   const head = incluirCantidad
   ? [['Nro', 'Nombre del medicamento', 'Presentación', 'CUM', 'Invima', 'Laboratorio', 'Lote', 'Vencimiento', 'Cantidad']]
   : [['Nro', 'Nombre del medicamento', 'Presentación', 'CUM', 'Invima', 'Laboratorio', 'Lote', 'Vencimiento']];

 
  autoTable(doc, {
     // head: [['Nro', 'Nombre del medicamento', 'Presentación', 'CUM', 'Invima', 'Laboratorio','Lote','Vencimiento','Cantidad']],
      head,
      body: this.datosOrden(orden,incluirCantidad),
      startY: 37,
      theme: 'striped',
      //theme: 'grid',
    /*  headStyles: {
        fillColor: [211, 211, 211], // Color gris claro
        textColor: [0, 0, 0], // Color del texto negro
        fontSize: 10, // Tamaño de la fuente
      },*/
      willDrawPage: function (data) {

        //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);

        doc.setFontSize(11);
        //doc.setFont("helvetica", "bold");
        doc.setDrawColor(0);
        //doc.setFillColor(255, 255, 255);
        //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
        let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('ORDEN DE DESPACHO Nro. ' + + orden.idDespacho.toString()) / 2);
        let titleYPos = doc.getTextWidth('ORDEN DE DESPACHO Nro. ' + orden.idDespacho.toString());
        doc.setDrawColor('#D3E3FD');
        doc.setFillColor('#D3E3FD');
        doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

        doc.addImage('/assets/logo.png', 'JPEG', 238, 3, 25, 20);
        //doc.setTextColor('#FFFFFF'); // Color blanco

        doc.text('ORDEN DE DESPACHO Nro. ' + orden.idDespacho.toString(), titleXPos, 14);
        // Establecer el color de la letra y el estilo de la fuente para el segundo texto
        doc.setTextColor('#000000'); // Color negro  #E5E5E5

        doc.text('Numero y fecha orden:', 17, 20);
        //doc.setTextColor('#E5E5E5'); // Color gris
        doc.text(orden.idDespacho.toString() + " - " +orden.fechaDespacho, 60, 20);

        doc.text('Bodega de origen:', 17, 25);
     
        doc.text(self.primerasmayusculas(orden.bodegaOrigen.nombre), 60, 25);
        doc.text('Funcionario despacho:', 17, 30);
        doc.text(orden.funcionarioDespacho, 60, 30);
        doc.text('Dirección:', 17, 35);
        doc.text(orden.bodegaOrigen.direccion, 60, 35);
        doc.text('Fecha recibe:', 137, 20);
        doc.text(self.controlRespuesta(orden.fechaEntradaDestino), 175, 20);
        doc.text('Bodega de destino:', 137, 25);
        doc.text(self.primerasmayusculas(orden.bodegaDestino.nombre), 175, 25);
        doc.text('Funcionario recibe:', 137, 30);
        doc.text(self.controlRespuesta(orden.funcionarioEntradaDestino), 175, 30);
        doc.text('Estado de la orden:', 137, 35);
        doc.text(orden.estado, 175, 35);
      },
      didDrawPage: function (data) {
        // Agrega el número de página en la parte superior derecha de cada página
        doc.setFontSize(10);
        doc.text('Página ' + paginaActual + ' de '+ totalPagesExp, 220, doc.internal.pageSize.height - 10);
        doc.text(orden.bodegaOrigen.direccion.toString(), 12, doc.internal.pageSize.height - 12);
        doc.text('Cel: '+ orden.bodegaOrigen.telefono.toString() +', Email: '+ orden.bodegaOrigen.email.toString(), 12, doc.internal.pageSize.height - 7);
        doc.setLineWidth(1.3);
        doc.setDrawColor(236, 255, 83); // draw red lines 
        doc.line(10, doc.internal.pageSize.height - 20, 10, doc.internal.pageSize.height - 5);
        paginaActual++;
      },
    });

    // Para calcular el total de páginas
    if (typeof doc.putTotalPages === 'function') {
      doc.putTotalPages(totalPagesExp);
  }

    var pdfDataUri = doc.output('datauri');
    var newWindow = window.open();
    if (newWindow) {
      newWindow.document.write('<iframe src="' + pdfDataUri + '" width="100%" height="100%"></iframe>');
    } else {
      // Manejar el caso en el que window.open() devuelve nulo
      console.error('No se pudo abrir una nueva ventana.');
    }
    
  }


  private datosOrden(orden: any, incluirCantidad: boolean) {
    const data = [];
    this.contador = 1;
    this.listaItemOrden = orden.itemsDespacho
    console.log(this.listaItemOrden);
    this.listaItemOrden = this.listaItemOrden.sort((a: any, b: any) => a.medicamento.nombre.localeCompare(b.medicamento.nombre));
    for (let i = 0; i < this.listaItemOrden.length; i++) {
         const rowData = [
          this.contador.toString(),
          this.primerasmayusculas(this.listaItemOrden[i].medicamento.nombre),
          this.primerasmayusculas(this.listaItemOrden[i].medicamento.forma.nombre),
          this.listaItemOrden[i].medicamento.codigoCum.toString(),
          this.listaItemOrden[i].invima.toString(),
          this.primerasmayusculas(this.listaItemOrden[i].laboratorio),
          this.listaItemOrden[i].lote.toString(),
          this.listaItemOrden[i].fechaVencimiento,
          //this.listaItemOrden[i].cantidad.toString(),
        ];
         // Si se incluye la cantidad, se agrega al final
    if (incluirCantidad) {
      rowData.push(this.listaItemOrden[i].cantidad.toString());
    }
        data.push(rowData);
        this.contador++;
    
    }
   // data.push(this.calcularTotalesRow());
    return data;
  }

  private calcularTotal(columna: string): string {
    const total = this.listaItemOrden.reduce((accum: number, current: any) => {
      return accum + (current[columna] ? 1 : 0);
    }, 0);
    return total.toString();
  }

  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }


  public controlRespuesta(verifica: string): string {
    if (verifica !== null && verifica !== undefined) {
      return verifica.toString();
    } else {
      return "";
    }

  }

}
