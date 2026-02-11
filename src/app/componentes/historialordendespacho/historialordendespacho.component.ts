import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { OrdendespachoService } from 'src/app/servicios/ordendespacho.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-historialordendespacho',
  templateUrl: './historialordendespacho.component.html',
  styleUrls: ['./historialordendespacho.component.css']
})
export class HistorialordendespachoComponent {

  listaOrdendespacho: any;
  listaOrdendespachofiltrada: any;
  listaregistros: any;
  listaItemOrden: any;
  consultaSeleccionada: string = '';
  generalForm!: FormGroup;
  idBodegaSeleccionada: string = '';
  idBodegausuario: boolean = false;
  contador: number = 0;
  lista: any = [];
  parametro: any;
  filaExpandida: number | null = null;


  constructor(
    private fb: FormBuilder,
    private ordendespachoservicio: OrdendespachoService,
    private bodegaservicio: BodegaService,
  ) {
    // Calcula la fecha actual
    const currentDate = new Date();
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 30);

    this.generalForm = this.fb.group
      ({
        idBodega: [''],
        tipoConsulta: ['todas'],
        fInicial: [date30DaysAgo.toISOString().split('T')[0]],
        fFinal: [currentDate.toISOString().split('T')[0]],
        soloajuste: [''],
      });
    //this. cargarRegistros();
  }

  ngOnInit(): void {
    this.parametro = parseInt(sessionStorage.getItem('bodega') || '0', 10);

    this.bodegaservicio.getRegistrosActivos().subscribe(
      (resp: any) => {
        this.listaregistros = resp;
        this.listaregistros.sort((a: any, b: any) => {
          const comparacionPorNombre = a.nombre.localeCompare(b.nombre);
          if (comparacionPorNombre === 0) {
            return a.puntoEntrega.localeCompare(b.puntoEntrega);
          }
          return comparacionPorNombre;
        });
        // this.generalForm.patchValue({ idBodega: +this.parametro });            
      },
      (err: any) => {
        console.error(err);
      }
    );

    this.generalForm.patchValue({ idBodega: + this.parametro });
    this.buscarOrdenDespacho();

  }

  onBodegaChange(event: any) {
    this.buscarOrdenDespacho();
  }

  buscarOrdenDespacho() {
    const bodegaId = this.generalForm.get('idBodega')?.value;
    this.idBodegaSeleccionada = bodegaId;
    const bodegaString = sessionStorage.getItem("bodega");
    this.idBodegausuario = bodegaString == bodegaId ? true : false;
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
    // Limpiar listas antes de cargar nueva data
    this.listaOrdendespacho = [];
    this.listaOrdendespachofiltrada = [];
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.ordendespachoservicio.getOrdenDespachoBodegaOrigen(bodegaId, this.generalForm.get('fInicial')?.value, this.generalForm.get('fFinal')?.value)
      .subscribe(resp => {
        this.listaOrdendespacho = resp;
        this.listaOrdendespacho.sort((a: any, b: any) => {
          // Primero ordena por fecha de despacho (descendente)
          const fechaComparacion = new Date(b.fechaDespacho).getTime() - new Date(a.fechaDespacho).getTime();
          // Si las fechas son iguales, ordena por idOrden (ascendente)
          if (fechaComparacion === 0) {
            return b.idDespacho - a.idDespacho;
          }
          return fechaComparacion;
        });
        this.listaOrdendespachofiltrada = this.listaOrdendespacho;
        this.generalForm.patchValue({ soloajuste: + false });
        Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
      },
        (error) => {
          console.error('❌ Error cargando registros', error);
          Swal.close(); // 🚨 Primero cerramos el spinner
          Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
        }
      );
  }

  consultarOrdenesPorBodegaDestino(bodegaId: number) {
    // Limpiar listas antes de cargar nueva data
    this.listaOrdendespacho = [];
    this.listaOrdendespachofiltrada = [];
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.ordendespachoservicio.getOrdenDespachoBodegaDestino(bodegaId, this.generalForm.get('fInicial')?.value, this.generalForm.get('fFinal')?.value)
      .subscribe(resp => {
        this.listaOrdendespacho = resp;
        this.listaOrdendespacho.sort((a: any, b: any) => {
          // Primero ordena por fecha de despacho (descendente)
          const fechaComparacion = new Date(b.fechaDespacho).getTime() - new Date(a.fechaDespacho).getTime();

          // Si las fechas son iguales, ordena por idOrden (ascendente)
          if (fechaComparacion === 0) {
            return b.idDespacho - a.idDespacho;
          }
          return fechaComparacion;
        });
        this.listaOrdendespachofiltrada = this.listaOrdendespacho;
        this.generalForm.patchValue({ soloajuste: + false });
        Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
      },
        (error) => {
          console.error('❌ Error cargando registros', error);
          Swal.close(); // 🚨 Primero cerramos el spinner
          Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
        }
      );
  }

  consultarTodasOrdenesPorBodega(bodegaId: number) {
    // Limpiar listas antes de cargar nueva data
    this.listaOrdendespacho = [];
    this.listaOrdendespachofiltrada = [];
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.ordendespachoservicio.getOrdenDespachoBodegaTodas(
      bodegaId,
      this.generalForm.get('fInicial')?.value,
      this.generalForm.get('fFinal')?.value
    ).subscribe(resp => {
      this.listaOrdendespacho = resp;
      this.listaOrdendespacho.sort((a: any, b: any) => {
        // Primero ordena por fecha de despacho (descendente)
        const fechaComparacion = new Date(b.fechaDespacho).getTime() - new Date(a.fechaDespacho).getTime();
        // Si las fechas son iguales, ordena por idOrden (ascendente)
        if (fechaComparacion === 0) {
          return b.idDespacho - a.idDespacho;
        }
        return fechaComparacion;
      });
      this.listaOrdendespachofiltrada = this.listaOrdendespacho;
     
      this.generalForm.patchValue({ soloajuste: + false });
      Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
    },
      (error) => {
        console.error('❌ Error cargando registros', error);
        Swal.close(); // 🚨 Primero cerramos el spinner
        Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
      }
    );
  }


  public eliminarOrdenDespacho(itemt: any) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `La orden de despacho Nro. ` + itemt.idDespacho + ` dirigida a la bodega ` + itemt.bodegaDestino.nombre + ` de la base de datos.`,
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
            text: `La orden de despacho número ` + itemt.idDespacho + ` dirigida a la bodega ` + itemt.bodegaDestino.nombre + ` ha sido eliminado correctamente.`,
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
      body: this.datosOrden(orden, incluirCantidad),
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
        let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('ORDEN DE DESPACHO / RECEPCION TECNICA  Nro. ' + + orden.idDespacho.toString()) / 2);
        let titleYPos = doc.getTextWidth('ORDEN DE DESPACHO / RECEPCION TECNICA Nro. ' + orden.idDespacho.toString());
        doc.setDrawColor('#D3E3FD');
        doc.setFillColor('#D3E3FD');
        doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

        doc.addImage('/assets/logo.png', 'JPEG', 238, 3, 25, 20);
        //doc.setTextColor('#FFFFFF'); // Color blanco

        doc.text('ORDEN DE DESPACHO / RECEPCION TECNICA Nro. ' + orden.idDespacho.toString(), titleXPos, 14);
        // Establecer el color de la letra y el estilo de la fuente para el segundo texto
        doc.setTextColor('#000000'); // Color negro  #E5E5E5

        doc.text('Numero y fecha orden:', 17, 20);
        //doc.setTextColor('#E5E5E5'); // Color gris
        doc.text(orden.idDespacho.toString() + " - " + orden.fechaDespacho, 60, 20);

        doc.text('Bodega de origen:', 17, 25);

        doc.text(self.primerasmayusculas(orden.bodegaOrigen.nombre), 60, 25);
        doc.text('Funcionario despacho:', 17, 30);
        doc.text(orden.funcionarioDespacho, 60, 30);
        doc.text('Dirección:', 17, 35);
        doc.text(orden.bodegaOrigen.direccion, 60, 35);
        doc.text('Fecha recibe:', 150, 20);
        doc.text(self.controlRespuesta(orden.fechaEntradaDestino), 185, 20);
        doc.text('Bodega de destino:', 150, 25);
        doc.text(self.primerasmayusculas(orden.bodegaDestino.nombre), 185, 25);
        doc.text('Funcionario recibe:', 150, 30);
        doc.text(self.controlRespuesta(orden.funcionarioEntradaDestino), 185, 30);
        doc.text('Estado de la orden:', 150, 35);
        doc.text(orden.estado, 185, 35);
      },
      didDrawPage: function (data) {
        // Agrega el número de página en la parte superior derecha de cada página
        doc.setFontSize(10);
        doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 220, doc.internal.pageSize.height - 10);
        doc.text(orden.bodegaOrigen.direccion.toString(), 12, doc.internal.pageSize.height - 12);
        doc.text('Cel: ' + orden.bodegaOrigen.telefono.toString() + ', Email: ' + orden.bodegaOrigen.email.toString(), 12, doc.internal.pageSize.height - 7);
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
    this.listaItemOrden = this.listaItemOrden.sort((a: any, b: any) => a.medicamento.nombre.localeCompare(b.medicamento.nombre));
    for (let i = 0; i < this.listaItemOrden.length; i++) {
      const rowData = [
        this.contador.toString(),
        this.primerasmayusculas(this.listaItemOrden[i].medicamento.nombre || ''),
        this.primerasmayusculas(this.listaItemOrden[i].medicamento.forma.nombre || ''),
        (this.listaItemOrden[i].medicamento.codigoCum || '').toString(),
        (this.listaItemOrden[i].invima || '').toString(),
        this.primerasmayusculas(this.listaItemOrden[i].laboratorio || ''),
        (this.listaItemOrden[i].lote || '').toString(),
        this.listaItemOrden[i].fechaVencimiento || '',
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


  async salidasExcelDetalleOrden(tipoReporte: number): Promise<void> {
    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    const idBodega = this.generalForm.get('idBodega')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Orden Despacho!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
      });
      return;  // Detener la ejecución si faltan las fechas
    }

    if (!idBodega) {
      Swal.fire({
        icon: 'error',
        title: `Orden Despacho!`,
        text: `No ha seleccionado la bodega de la que desea generar el reporte!`,
      });
      return;  // Detener la ejecución si faltan las fechas
    }
    const fechaInicial = new Date(fInicial);
    const fechaFinal = new Date(fFinal);

    if (fechaInicial > fechaFinal) {
      Swal.fire({
        icon: 'error',
        title: `Invertidas!`,
        text: `La fecha inicial del periodo no puede ser mayor que la fecha final!`,
      });
      return;  // Detener la ejecución si las fechas no son válidas
    }
    try {
      // Esperar la promesa con await 

      const parametrobodega = Number(idBodega);
      let resp: any;
      let fileName: string = tipoReporte === 0 ? "Entradas" : "Salidas";
      resp = await this.ordendespachoservicio.getDetalleOrdenDespacho(parametrobodega, fInicial, fFinal, tipoReporte).toPromise();

      // Asegurarse de que resp sea un array antes de asignarlo
      if (Array.isArray(resp)) {
        this.lista = resp;
        this.excelDetalleOrdenDespacho(fileName); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }
    } catch (error) {
      console.error("Error al obtener los datos de detallados de las ordenes de despacho:", error);
    }
  }

  excelDetalleOrdenDespacho(fileName: string) {  // Crea un array con los datos de la orden de despacho que deseas exportar
    // Crea un array con los datos de la orden de despacho que deseas exportar
    const datos: any[] = [];

    // Encabezados de la tabla
    const encabezado = [
      'ID MEDICAMENTO',
      'CUM',
      'NOMBRE MEDICAMENTO',
      'PRESENTACION',
      'CONTROLADO',
      'CANTIDAD',
      'ID ORDEN',
      'FECHA DESPACHO',
      'ESTADO',
      'BODEGA ORIGEN',
      'FUNCIONARIO DESPACHO',
      'BODEGA DESTINO',
      'FUNCIONARIO INGRESO',
      'TIPO DE ORDEN',
    ];
    datos.push(encabezado);

    let controladoCadena = "";
    // Agrega los items de despacho al array
    this.lista.forEach((item: any) => {

      controladoCadena = item.controlado ? "SI" : "NO";
      datos.push([
        item.idMedicamento || '',  // Validación si es null o undefined
        item.codigoCum || '',
        item.nombreMedicamento || '',
        item.presentacion || '',
        controladoCadena,
        item.cantidad || '',
        item.idDespacho || '',
        item.fechaDespacho || '',
        item.estado || '',
        item.bodegaOrigen || '',
        item.funcionarioDespacho || '',
        item.bodegaDestino || '',
        item.funcionarioEntradaDestino || '',
        item.tipo || ''
      ]);
    });

    // Crea la hoja de trabajo de Excel (worksheet)
    const hojaDeTrabajo: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(datos);

    // Aplicar formato al encabezado
    const rangoEncabezado = XLSX.utils.decode_range(hojaDeTrabajo['!ref'] as string);
    for (let col = rangoEncabezado.s.c; col <= rangoEncabezado.e.c; col++) {
      const celda = hojaDeTrabajo[XLSX.utils.encode_cell({ r: 0, c: col })]; // Primera fila, r: 0
      if (celda) {
        celda.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } }, // Texto en negrita y color blanco
          alignment: { horizontal: "center", vertical: "center" }, // Centrado horizontal y vertical
          fill: { fgColor: { rgb: "4F81BD" } }, // Color de fondo azul
        };
      }
    }

    // Crea el libro de trabajo (workbook)
    const libroDeTrabajo: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, fileName);
    // Genera y descarga el archivo Excel
    XLSX.writeFile(libroDeTrabajo, 'Relacion_Despachos_' + fileName + new Date().getTime() + '.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte fue exportado en su carpeta de descargas en formato xslx`,

    });
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

  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem("nivel"));
    if (isNaN(nivelUsuario)) {
      return false;
    }
    return nivelUsuario >= nivelRequerido;
  }



  onAjuste(event: any): void {
    if (event.target.checked) {
      this.listaOrdendespachofiltrada = this.listaOrdendespacho;
      this.listaOrdendespacho = this.listaOrdendespacho.filter((registro: any) => registro.estado != 'Recepción');
    }
    else {
      this.listaOrdendespacho = this.listaOrdendespachofiltrada;
    }
  }

  devolverOrdenDespacho(orden: any) {
    let funcionario = sessionStorage.getItem("nombre");
    if (this.tieneAcceso(3)) {
      Swal.fire({
        title: 'Desea devolver?',
        text: 'Esta seguro de devolver las catidades de los medicamentos de la orden de despacho Nro. ' + orden.idDespacho + ' , se regresara al inventario de la bodega de origen ' + orden.bodegaOrigen.nombre + ' y la orden quedará en modo creación para que la edite, la reprocese o la elimine.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Si, devolver!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.ordendespachoservicio.regresarinventariocangeBodegaorigen(orden.idDespacho, orden.bodegaOrigen.idBodega, funcionario!).subscribe(resp => {
            this.buscarOrdenDespacho();
            Swal.fire({
              icon: 'success',
              title: `Ok`,
              text: 'De la orden de despacho Nr. ' + orden.idDespacho + ' fueron devuelto todas las cantidades de cada medicamento a la bodega de origen ' + orden.bodegaOrigen.nombre + ' correctamente, queda en modo creación!',
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
    else {
      Swal.fire({
        icon: 'warning',
        title: `Falta de permisos`,
        text: "No tienes permisos para realizar la modificación en la devolución del medicamento en la orden de despacho, comunicate con el funcionario encargado!",
      });
    }
  }

  toggleDetalles(index: number) {
    // Si ya está abierta, la cierra; si no, la abre
    this.filaExpandida = this.filaExpandida === index ? null : index;
  }

  public exportarOrdenesxlsx(idBodega: number) {
    const datos: any[] = [];
    // Encabezados de la tabla
    const encabezado = [
      'CONSECUTIVO',
      'NUMERO DE ORDEN',
      'FECHA DE LA ORDEN',
      'TIPO',
      'BODEGA ORIGEN',
      'FUNCIONARIO QUE HIZO LA ORDEN',
      'BODEGA DESTINO',
      'FUNCIONARIO QUE RECIBIO LA ORDEN',
      'FECHA DE RECIBIDO',
      'NUMERO DE ITEMS',
      'ESTADO DE LA ORDEN',
      'NOMBRE DEL PROVEEDOR',
      'NIT DEL PROVEEDOR',
      'NUMERO FACTURA',
      'VALOR FACTURA',
      'TIPO INGRESO',
      'OBSERVACIÓN'
    ];

    datos.push(encabezado);
    let contador = 0;
    // Agrega los items de despacho al array
    this.listaOrdendespachofiltrada.forEach((item: any) => {
      contador++;
      datos.push([
        contador || '',  // Validación si es null o undefined
        item.idDespacho || '',
        item.fechaDespacho || '',
        item.tipo || '',
        item.bodegaOrigen.nombre || '',
        item.funcionarioDespacho || '',
        item.bodegaDestino.nombre || '',
        item.funcionarioEntradaDestino || '',
        item.fechaEntradaDestino || '',
        item.itemsDespacho.length || '0',
        item.estado || '',
        item.nomProvedor || '',
        item.nitProvedor || '',
        item.numFactura || '',  // nombre de la farmacia
        item.valor || '',
        item.tipoIngreso || '',
        (item.observacion ? item.observacion.toUpperCase() : '')

      ]);
    });

    // Crea la hoja de trabajo de Excel (worksheet)
    const hojaDeTrabajo: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(datos);

    // Aplicar formato al encabezado
    const rangoEncabezado = XLSX.utils.decode_range(hojaDeTrabajo['!ref'] as string);
    for (let col = rangoEncabezado.s.c; col <= rangoEncabezado.e.c; col++) {
      const celda = hojaDeTrabajo[XLSX.utils.encode_cell({ r: 0, c: col })]; // Primera fila, r: 0
      if (celda) {
        celda.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } }, // Texto en negrita y color blanco
          alignment: { horizontal: "center", vertical: "center" }, // Centrado horizontal y vertical
          fill: { fgColor: { rgb: "4F81BD" } }, // Color de fondo azul
        };
      }
    }

    // Crea el libro de trabajo (workbook)
    const libroDeTrabajo: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'ORDENES');
    // Genera y descarga el archivo Excel
    XLSX.writeFile(libroDeTrabajo, 'ORDENES_' + new Date().getTime() + '.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte fue exportado en su carpeta de descargas en formato xslx`,

    });
  }

  getColorPorTipo(tipo: string): string {
    switch ((tipo || '').toUpperCase()) {
      case 'COMPRA': return 'rgba(65, 165, 71, 1)';      // Verde
      case 'PRESTAMO': return '#8644adff';    // Morado
      case 'DONACION': return '#e67e22';    // Naranja
      case 'REINTEGRO': return '#e62298de';    // Naranja
      default: return '#6c757d';            // Gris por defecto
    }
  }


  getItemsOrdenados(itemt: any) {
  if (!itemt?.itemsDespacho) return [];
  return itemt.itemsDespacho
    .slice() // copia para no alterar el original
    .sort((a: any, b: any) =>
      (a.medicamento?.nombre || '').localeCompare(b.medicamento?.nombre || '')
    );
}


  reporteEnConstruccion() {
    Swal.fire({
      icon: 'info',
      title: `En construcción!`,
      text: `El reporte esta en proceso de construcción, te estaremos informando cuando esté disponible!`,
    });
  }

}
