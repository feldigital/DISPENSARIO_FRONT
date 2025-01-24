import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { BodegaI } from 'src/app/modelos/bodega.model';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FormulaService } from 'src/app/servicios/formula.service';



@Component({
  selector: 'app-bodega',
  templateUrl: './bodega.component.html',
  styleUrls: ['./bodega.component.css']
})
export class BodegaComponent implements OnInit {

  generalForm!: FormGroup;
  keyword = 'nomCompleto';
  nombrebtn!: string;
  listaregistros: any;
  banderaRegistro!: boolean;
  listaDpto: any;
  listaMpio: any;
  parametro: any;
  lista: any = [];
  contador: number = NaN;
  hoy!: string;

  constructor(
    private fb: FormBuilder,
    private servicio: BodegaService,
    private servicioFormula: FormulaService
  ) {


    this.mostrarActivos();
    this.nombrebtn = "Crear";
    this.banderaRegistro = false;
    this.cargarDepartamentos();
  }

  ngOnInit(): void {
    this.crearFormulario();
    const fechaActual = new Date();
    const date30DaysAgo = new Date(fechaActual);   
    this.hoy = fechaActual.toISOString().split('T')[0];  // Formato YYYY-MM-DD  
  }

  onDptoSeleccionado() {
    const dptoSeleccionado = this.generalForm.get('departamento')?.value;
    this.servicio.getMunicipiosDepartamento(dptoSeleccionado).subscribe((resp: any) => {
      this.listaMpio = resp;
    },
      (err: any) => { console.error(err) }
    );

  }

  cargarDepartamentos() {
    this.servicio.getDepartamentos()
      .subscribe((resp: any) => {
        this.listaDpto = resp;
      },
        (err: any) => { console.error(err) }
      );
  }


  /*FUNCION DE CREACION DEL FORMULARIO*/
  crearFormulario() {
    this.generalForm = this.fb.group
      ({
        idBodega: [''],
        nombre: ['', [Validators.required]],
        departamento: ['', [Validators.required]],
        municipio: ['', [Validators.required]],
        direccion: ['', [Validators.required]],
        telefono: ['', [Validators.required]],
        email: [''],
        puntoEntrega: ['', [Validators.required]],
        estado: ['true', [Validators.required]],
        dispensa: ['false', [Validators.required]],
        fInicial: [''],
        fFinal: [''],
      });
  }



  mostrarRegistro(itemt: any) {
    this.nombrebtn = "Actualizar";
    this.servicio.getMunicipiosDepartamento(itemt.departamento).subscribe(
      (municipios: any[]) => {
        this.listaMpio = municipios;

        // Utiliza patchValue para establecer solo los campos necesarios
        this.generalForm.patchValue({
          idBodega: itemt.idBodega,
          nombre: itemt.nombre,
          puntoEntrega: itemt.puntoEntrega,
          departamento: itemt.departamento,
          municipio: itemt.municipio,
          direccion: itemt.direccion,
          telefono: itemt.telefono,
          email: itemt.email,
          estado: itemt.estado,
          dispensa: itemt.dispensa
        });
      },
      (err) => {
        console.error(err);
      }
    );
  }


  mostrarActivos() {
    this.servicio.getRegistrosActivos()
      .subscribe((resp: any) => {
        this.listaregistros = resp;
        this.listaregistros.sort((a: any, b: any) => {
          const comparacionPorNombre = a.nombre.localeCompare(b.nombre);
          if (comparacionPorNombre === 0) {
            const comparacionPorPunto = a.puntoEntrega.localeCompare(b.puntoEntrega);
            if (comparacionPorPunto === 0) {
              return a.puntoEntrega.localeCompare(b.puntoEntrega);
            }
            return comparacionPorPunto;
          }
          return comparacionPorNombre;
        });
      },
        (err: any) => { console.error(err) }
      );
    this.banderaRegistro = false;
  }

  mostrarInactivos() {
    this.servicio.getRegistrosInactivos()
      .subscribe((resp: any) => {
        this.listaregistros = resp;
        this.listaregistros.sort((a: any, b: any) => {
          const comparacionPorNombre = a.nombre.localeCompare(b.nombre);
          if (comparacionPorNombre === 0) {
            const comparacionPorPunto = a.puntoEntrega.localeCompare(b.puntoEntrega);
            if (comparacionPorPunto === 0) {
              return a.puntoEntrega.localeCompare(b.puntoEntrega);
            }
            return comparacionPorPunto;
          }
          return comparacionPorNombre;
        });
      },
        (err: any) => { console.error(err) }
      );
    this.banderaRegistro = true;
  }


  create() {
    this.generalForm.value.usuario = localStorage.getItem("lidersistema");
    if (this.generalForm.status == 'VALID') {
      if (this.nombrebtn == "Crear") {
        this.servicio.create(this.generalForm.value).subscribe(ciclo => {
          this.mostrarActivos();
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La bodega ha sido creado correctamente`,
          });
          this.generalForm.reset();
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo guardar la bodega en la base de datos!',
              footer: err.mensaje //JSON.stringify(err)
            });
          }
        );
      }
      else {

        this.servicio.update(this.generalForm.value).subscribe(ciclo => {
          this.mostrarActivos();
          this.nombrebtn = "Crear";
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La bodega ha sido actualizado correctameente`,
          });
          this.generalForm.reset();
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo actualizar la bodega en la base de datos!',
              footer: err.mensaje
            });
          });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: 'Datos incompletos para crear la bodega en la base de datos!'
      });
    }
  }


  eliminarRegistro(itemt: BodegaI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `La bodega ` + itemt.nombre + " - " + itemt.puntoEntrega + ` de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.delete(itemt.idBodega).subscribe(resp => {
          this.listaregistros = this.listaregistros.filter((cli: BodegaI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La bodega ha sido eliminado correctamente.`,
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

  reportePendientesTodos(): void {
    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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
    this.datosPendientesTodos(0, fInicial, fFinal).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true 
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;
      let corte = "Periodo del reporte del " + fInicial + " al " + fFinal;
      autoTable(doc, {
        head: [['Nro', 'CUM', 'Nombre del medicamento', 'Presentación', 'Existencias','Pendientes']],
        body: bodyData,
        startY: 25,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('RELACION DE MEDICAMENTOS PENDIENTES') / 2);
          let titleYPos = doc.getTextWidth('RELACION DE MEDICAMENTOS PENDIENTES');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 238, 3, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('RELACION DE MEDICAMENTOS PENDIENTES', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5
          titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth(corte) / 2);
          doc.text(corte, titleXPos, 21);

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text('CALLE 24 #18A-101 Barrio Santa Catalina ', 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: 3004407974, Email: npizarro@sism.com.co', 12, doc.internal.pageSize.height - 7);
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
    });
  }

  private async datosPendientesTodos(idBodega: number, fInicial: string, fFinal: string): Promise<RowInput[] | undefined> {
    
    const data: RowInput[] = [];
    try {
   
      const resp: any = await this.servicio.getMedicamentosBodegaPendiente(idBodega, fInicial, fFinal).toPromise();
      this.lista = resp; 
      this.lista.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));    
      console.log(this.lista); 

      for (let i = 0; i < this.lista.length; i++) {
        const rowData: RowInput = [
          (i + 1).toString(),
          this.lista[i].cum,
          this.lista[i].nombre,
          this.primerasmayusculas(this.lista[i].forma),
          this.lista[i].cantidad,          
          this.lista[i].pendiente,
        ];

        data.push(rowData);


      }
      // data.push(this.calcularTotalesRow());
      //return data;
      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  reportePendientes(bodega: any): void {
    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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

    this.datosPendientes(bodega.idBodega, fInicial, fFinal).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;
      let corte = "Periodo del reporte: " + fInicial + " al " + fFinal;
      autoTable(doc, {
        head: [['Nro', 'CUM', 'Nombre del medicamento', 'Presentación', 'Existencia','Dotación','Pendiente']],
        body: bodyData,
        startY: 37,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('RELACION DE MEDICAMENTOS PENDIENTES') / 2);
          let titleYPos = doc.getTextWidth('RELACION DE MEDICAMENTOS PENDIENTES');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 238, 3, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('RELACION DE MEDICAMENTOS PENDIENTES', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5
         

          doc.text('Nombre de la bodega:', 17, 20);
          //doc.setTextColor('#E5E5E5'); // Color gris
          doc.text(bodega.nombre.toString() + " - " + bodega.puntoEntrega, 60, 20);
          doc.text('Municipio:', 17, 25);
          doc.text(bodega.municipio, 60, 25);
          doc.text('Dirección:', 17, 30);
          doc.text(bodega.direccion, 60, 30);
          doc.text('Teléfono:', 17, 35);
          doc.text(bodega.telefono, 60, 35);

          titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth(corte) / 2);
          doc.text(corte, titleXPos +30, 35);

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text(bodega.direccion.toString(), 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: ' + bodega.telefono.toString() + ', Email: ' + bodega.email.toString(), 12, doc.internal.pageSize.height - 7);
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
    });
  }

  private async datosPendientes(idBodega: number, fInicial: string, fFinal: string): Promise<RowInput[] | undefined> {
    
    const data: RowInput[] = [];
    try {
   
      const resp: any = await this.servicio.getMedicamentosBodegaPendiente(idBodega, fInicial, fFinal).toPromise();
      this.lista = resp; 
      this.lista.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));    
      console.log(this.lista); 

      for (let i = 0; i < this.lista.length; i++) {
        const rowData: RowInput = [
          (i + 1).toString(),
          this.lista[i].cum,
          this.lista[i].nombre,
          this.primerasmayusculas(this.lista[i].forma),
          this.lista[i].cantidad,          
          this.lista[i].ultFecIngreso.split('T')[0],
          this.lista[i].pendiente,
        ];

        data.push(rowData);


      }
      // data.push(this.calcularTotalesRow());
      //return data;
      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }



  reporteStopMinimo(bodega: any): void {
    
    this.datosStopMinimo(bodega).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;

      autoTable(doc, {
        head: [['Nro', 'CUM', 'Nombre del medicamento', 'Presentación', 'Cantidad existente', 'Stop Minimo']],
        body: bodyData,
        startY: 37,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('MEDICAMENTOS EN LA BODEGA POR DEBAJO DEL STOP MINIMO') / 2);
          let titleYPos = doc.getTextWidth('MEDICAMENTOS EN LA BODEGA POR DEBAJO DEL STOP MINIMO');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 180, 8, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('MEDICAMENTOS EN LA BODEGA POR DEBAJO DEL STOP MINIMO', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5

          doc.text('Nombre de la bodega:', 17, 20);
          //doc.setTextColor('#E5E5E5'); // Color gris
          doc.text(bodega.nombre.toString() + " - " + bodega.puntoEntrega, 60, 20);
          doc.text('Municipio:', 17, 25);
          doc.text(bodega.municipio, 60, 25);
          doc.text('Dirección:', 17, 30);
          doc.text(bodega.direccion, 60, 30);
          doc.text('Teléfono:', 17, 35);
          doc.text(bodega.telefono, 60, 35);

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text(bodega.direccion.toString(), 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: ' + bodega.telefono.toString() + ', Email: ' + bodega.email.toString(), 12, doc.internal.pageSize.height - 7);
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
    });

  }

  private async datosStopMinimo(bodega: any): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
      const resp: any = await this.servicio.getRegistrosMedicamentoBodega(bodega.idBodega).toPromise();
      this.lista = resp;
      this.lista.sort((a: any, b: any) => b.nombre - a.nombre);
      //const data = [];
      for (let i = 0; i < this.lista.length; i++) {
        if (this.lista[i].cantidad < this.lista[i].stopMinimo) {
          this.contador++;
          const rowData: RowInput = [
            this.contador.toString(),
            this.lista[i].cum,
            this.lista[i].nombre,
            this.primerasmayusculas(this.lista[i].forma),
            this.lista[i].cantidad,
            this.lista[i].stopMinimo,
          ];
          data.push(rowData);
        }

      }
      // data.push(this.calcularTotalesRow());
      //return data;
      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }



  reporteExistenciasActuales(bodega: any): void {
    this.datosExistencia(bodega.idBodega).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;

      autoTable(doc, {
        head: [['Nro', 'CUM', 'ID', 'Nombre del medicamento', 'Presentación', 'Cantidad existente']],
        body: bodyData,
        startY: 32,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('EXISTENCIA DE MEDICAMENTOS EN LA BODEGA') / 2);
          let titleYPos = doc.getTextWidth('EXISTENCIA DE MEDICAMENTOS EN LA BODEGA');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 180, 8, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('EXISTENCIA DE MEDICAMENTOS EN LA BODEGA', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5

          doc.text('Nombre de la bodega:', 17, 20);
          //doc.setTextColor('#E5E5E5'); // Color gris
          doc.text(bodega.nombre.toString() + " - " + bodega.puntoEntrega, 60, 20);
          //doc.text('Municipio:', 17, 25);
          //doc.text(bodega.municipio, 60, 25);
          doc.text('Dirección:', 17, 25);
          doc.text(bodega.direccion, 60, 25);
          doc.text('Teléfono:', 17, 30);
          doc.text(bodega.telefono, 60, 30);

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text(bodega.direccion.toString(), 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: ' + bodega.telefono.toString() + ', Email: ' + bodega.email.toString(), 12, doc.internal.pageSize.height - 7);
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
    });

  }

  reporteExistenciasActualestotal(): void {
    this.datosExistencia(0).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;
      let corte = "Fecha y hora del reporte ";
      autoTable(doc, {
        head: [['Nro', 'CUM','ID', 'Nombre del medicamento', 'Presentación', 'Cantidad existente']],
        body: bodyData,
        startY: 25,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('EXISTENCIA DE MEDICAMENTOS EN TODAS LAS BODEGAS') / 2);
          let titleYPos = doc.getTextWidth('EXISTENCIA DE MEDICAMENTOS EN TODAS LAS BODEGAS');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 180, 8, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('EXISTENCIA DE MEDICAMENTOS EN TODAS LAS BODEGAS', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5
          titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth(corte) / 2);
          doc.text(corte, titleXPos, 21);
          

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text('CALLE 24 #18A-101 Barrio Santa Catalina ', 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: 3004407974, Email: npizarro@sism.com.co', 12, doc.internal.pageSize.height - 7);
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
    });

  }


  private async datosExistencia(bodega: number): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
      const resp: any = await this.servicio.getRegistrosMedicamentoBodega(bodega).toPromise();
      this.lista = resp;
      this.lista.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));  
      this.contador = 0;  
      for (let i = 0; i < this.lista.length; i++) {
        if(this.lista[i].cantidad > 0){
          this.contador ++;
        const rowData: RowInput = [
          this.contador.toString(),
          this.lista[i].cum,
          this.lista[i].idMedicamento,
          this.lista[i].nombre,
          this.primerasmayusculas(this.lista[i].forma),
          this.lista[i].cantidad,
        ];
        data.push(rowData);
      }

      }
   
      // data.push(this.calcularTotalesRow());
      //return data;
      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }


  reporteCuotasModeradoras(bodega: any): void {

    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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

    this.datosCuotasModeradoras(bodega, fInicial, fFinal).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;
      let corte = "Periodo del reporte del " + fInicial + " al " + fFinal;
      autoTable(doc, {
        head: [['Nro', 'Nombre del dispensario', 'Nro. de Formulas', 'Valor recaudo']],
        body: bodyData,
        startY: 25,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('RELACION DE RECAUDO DE CUOTAS MODERADORAS') / 2);
          let titleYPos = doc.getTextWidth('RELACION DE RECAUDO DE CUOTAS MODERADORAS');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 180, 8, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('RELACION DE RECAUDO DE CUOTAS MODERADORAS', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5
          titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth(corte) / 2);
          doc.text(corte, titleXPos, 21);

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text('CALLE 24 #18A-101 Barrio Santa Catalina ', 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: 3004407974, Email: npizarro@sism.com.co', 12, doc.internal.pageSize.height - 7);
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
    });

  }


  private async datosCuotasModeradoras(bodega: number, fInicial: string, fFinal: string): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
      const resp: any = await this.servicioFormula.getCuotasModeradorasPDF(bodega, fInicial, fFinal).toPromise();
      this.lista = resp;      
      this.lista.sort((a: any, b: any) => a.dato_1.localeCompare(b.dato_1));  
      this.contador = 0;;
      for (let i = 0; i < this.lista.length; i++) {
        const rowData: RowInput = [
          (i + 1).toString(),
          this.lista[i].dato_1 ?? '', // Verifica si existe, si no, coloca un valor por defecto
          this.lista[i].d_1?.toString() ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
          this.lista[i].d_2?.toString() ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
        ];
        data.push(rowData);

      }
      data.push(
        [
          '',
          'Subtotales:',
          this.calcularTotal("d_1"),
          this.calcularTotal("d_2"),

        ]
      );

      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }


  reporteFormulasPrescritas(): void {

    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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

    this.datosFormulasPrescritas(fInicial, fFinal).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;
      let corte = "Periodo del reporte del " + fInicial + " al " + fFinal;
      autoTable(doc, {
        head: [['Nro', 'Nombre del dispensario', 'Procesadas', 'Anuladas', 'Total formulas']],
        body: bodyData,
        startY: 25,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('RELACION DE CONSOLIDADOS DE FORMULA PRESCRITAS') / 2);
          let titleYPos = doc.getTextWidth('RELACION DE CONSOLIDADOS DE FORMULA PRESCRITAS');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 180, 8, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('RELACION DE CONSOLIDADOS DE FORMULA PRESCRITAS', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5
          titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth(corte) / 2);
          doc.text(corte, titleXPos, 21);

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text('CALLE 24 #18A-101 Barrio Santa Catalina', 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: 3004407974, Email: npizarro@sism.com.co', 12, doc.internal.pageSize.height - 7);
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
    });

  }


  private async datosFormulasPrescritas(fInicial: string, fFinal: string): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
      const resp: any = await this.servicioFormula.getFormulasPrescritas(fInicial, fFinal).toPromise();
      this.lista = resp;
      this.lista.sort((a: any, b: any) => a.dato_1.localeCompare(b.dato_1));  
      this.contador = 0;;
      for (let i = 0; i < this.lista.length; i++) {
        const rowData: RowInput = [
          (i + 1).toString(),
          this.lista[i].dato_1 ?? '', // Verifica si existe, si no, coloca un valor por defecto
          this.lista[i].d_1?.toString() ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
          this.lista[i].d_2?.toString() ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
          this.lista[i].d_3?.toString() ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
        ];
        data.push(rowData);

      }
      data.push(
        [
          '',
          'Subtotales:',
          this.calcularTotal("d_1"),
          this.calcularTotal("d_2"),
          this.calcularTotal("d_3"),
        ]
      );
      //return data;
      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }


  reporteFormulasNoProcesadas(idBodega:number): void {

    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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

    this.datosFormulasNoProcesadas(idBodega,fInicial, fFinal).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;
      let corte = "Periodo del reporte del " + fInicial + " al " + fFinal;
      autoTable(doc, {
        head: [['Nro', 'Tipo y Documento', 'Nombre del paciente',  'Nro. Formula', 'Fecha Solicitud','Dispensario','Funcionario']],
        body: bodyData,
        startY: 25,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('RELACION DE FORMULAS PENDIENTE DEL PASO DE GENERAR LA ENTREGA') / 2);
          let titleYPos = doc.getTextWidth('RELACION DE FORMULAS PENDIENTE DEL PASO DE GENERAR LA ENTREGA');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 240, 8, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('RELACION DE FORMULAS PENDIENTE DEL PASO DE GENERAR LA ENTREGA', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5
          titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth(corte) / 2);
          doc.text(corte, titleXPos, 21);

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text('CALLE 24 #18A-101 Barrio Santa Catalina', 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: 3004407974, Email: npizarro@sism.com.co', 12, doc.internal.pageSize.height - 7);
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
    });

  }


  private async datosFormulasNoProcesadas(idBodega: number, fInicial: string, fFinal: string): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
      const resp: any = await this.servicioFormula.getFormulasNoProcesadas(idBodega,fInicial, fFinal).toPromise();
      this.lista = resp;
      //this.lista.sort((a: any, b: any) => b.nombre - a.nombre);
      console.log(resp);
      this.contador = 0;;
      for (let i = 0; i < this.lista.length; i++) {
        const rowData: RowInput = [
          (i + 1).toString(),
          `${this.lista[i].tipoDoc ?? ''} ${this.lista[i].numDocumento ?? ''}`, // Espacio entre tipoDoc y numDocumento
          `${this.lista[i].pNombre ?? ''} ${this.lista[i].sNombre ?? ''} ${this.lista[i].pApellido ?? ''} ${this.lista[i].sApellido ?? ''}`, // Espacios entre nombres y apellidos
          this.lista[i].idFormula ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
          this.lista[i].fecSolicitud ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
          this.lista[i].bodega ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
          this.lista[i].funcionario ?? '',
        ];
        data.push(rowData);

      }      
      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }



  reporteBodegaEntregas(bodega: any): void {
    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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

    this.datosBodegaEntregas(bodega, fInicial, fFinal).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;

      autoTable(doc, {
        head: [['Nro', 'CUM', 'Nombre del medicamento', 'Presentación', 'Cantidad entregadas']],
        body: bodyData,
        startY: 37,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('RELACION DE MEDICAMENTOS ENTREGADOS POR BODEGA') / 2);
          let titleYPos = doc.getTextWidth('RELACION DE MEDICAMENTOS ENTREGADOS POR BODEGA');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 180, 8, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('RELACION DE MEDICAMENTOS ENTREGADOS POR BODEGA', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5

          doc.text('Nombre de la bodega:', 17, 20);
          //doc.setTextColor('#E5E5E5'); // Color gris
          doc.text(bodega.nombre.toString() + " - " + bodega.puntoEntrega, 60, 20);
          doc.text('Municipio:', 17, 25);
          doc.text(bodega.municipio, 60, 25);
          doc.text('Dirección:', 17, 30);
          doc.text(bodega.direccion, 60, 30);
          doc.text('Teléfono:', 17, 35);
          doc.text(bodega.telefono, 60, 35);

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text(bodega.direccion.toString(), 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: ' + bodega.telefono.toString() + ', Email: ' + bodega.email.toString(), 12, doc.internal.pageSize.height - 7);
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
    });

  }

  private async datosBodegaEntregas(bodega: any, fInicial: string, fFinal: string): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
      const resp: any = await this.servicio.getMedicamentosBodegaEntregados(bodega.idBodega, fInicial, fFinal).toPromise();
      this.lista = resp;
      this.lista.sort((a: any, b: any) => b.nombre - a.nombre);
      //const data = [];
      for (let i = 0; i < this.lista.length; i++) {

        this.contador++;
        const rowData: RowInput = [
          this.contador.toString(),
          this.lista[i].cum,
          this.lista[i].nombre,
          this.primerasmayusculas(this.lista[i].forma),
          this.lista[i].cantidadEntregada,

        ];
        data.push(rowData);


      }
      // data.push(this.calcularTotalesRow());
      //return data;
      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }


  reporteBodegaEntregasMeses(bodega: any): void {

    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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

    this.datosBodegaEntregasMeses(bodega, fInicial, fFinal).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [220, 340],
        putOnlyUsedFonts: true

      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;

      autoTable(doc, {
        head: [['Nro', 'CUM', 'Nombre del medicamento', 'Presentación', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Total']],
        body: bodyData,
        startY: 37,
        theme: 'striped',
        //theme: 'grid',

        willDrawPage: function (data) {
          //doc.addImage('/assets/vertical.jpg', 'JPEG', 0, 5, 15, 60);
          doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
          //doc.setFillColor(255, 255, 255);
          //doc.roundedRect(15, 8, 250, 31, 3, 3, "FD");
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('MEDICAMENTOS ENTREGADOS POR BODEGA CONSOLIDADO POR MESES') / 2);
          let titleYPos = doc.getTextWidth('MEDICAMENTOS ENTREGADOS POR BODEGA CONSOLIDADO POR MESES');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");

          doc.addImage('/assets/logo.png', 'JPEG', 280, 8, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('MEDICAMENTOS ENTREGADOS POR BODEGA CONSOLIDADO POR MESES', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          doc.setTextColor('#000000'); // Color negro  #E5E5E5

          doc.text('Nombre de la bodega:', 17, 20);
          //doc.setTextColor('#E5E5E5'); // Color gris
          doc.text(bodega.nombre.toString() + " - " + bodega.puntoEntrega, 60, 20);
          doc.text('Municipio:', 17, 25);
          doc.text(bodega.municipio, 60, 25);
          doc.text('Dirección:', 17, 30);
          doc.text(bodega.direccion, 60, 30);
          doc.text('Teléfono:', 17, 35);
          doc.text(bodega.telefono, 60, 35);

        },
        didDrawPage: function (data) {
          // Agrega el número de página en la parte superior derecha de cada página
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text(bodega.direccion.toString(), 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: ' + bodega.telefono.toString() + ', Email: ' + bodega.email.toString(), 12, doc.internal.pageSize.height - 7);
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
    });

  }

  private async datosBodegaEntregasMeses(bodega: any, fInicial: string, fFinal: string): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
      const resp: any = await this.servicio.getMedicamentosBodegaEntregadosMeses(bodega.idBodega, fInicial, fFinal).toPromise();
      this.lista = resp;           
      this.lista.sort((a: any, b: any) => a.dato_2.localeCompare(b.dato_2));  
      console.log(this.lista);
      for (let i = 0; i < this.lista.length; i++) {
        this.contador++;
        const rowData: RowInput = [
          this.contador.toString(),
          this.lista[i].dato_1,
          this.lista[i].dato_2,

          this.primerasmayusculas(this.lista[i].dato_3),
          this.lista[i].d_1,
          this.lista[i].d_2,
          this.lista[i].d_3,
          this.lista[i].d_4,
          this.lista[i].d_5,
          this.lista[i].d_6,
          this.lista[i].d_7,
          this.lista[i].d_8,
          this.lista[i].d_9,
          this.lista[i].d_10,
          this.lista[i].d_11,
          this.lista[i].d_12,
          this.lista[i].d_t,

        ];
        data.push(rowData);


      }
      // data.push(this.calcularTotalesRow());
      //return data;
      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }



  private calcularTotal(columna: string): string {
    const total = this.lista.reduce((accum: number, current: any) => {
      return accum + (current[columna] ? current[columna] : 0);
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



  async reporteBodegaEntregasDetalldasTodas(): Promise<void> {
    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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
      const resp: any = await this.servicio.getMedicamentosBodegaEntregaDetallada(0, fInicial, fFinal).toPromise();

      // Asegurarse de que resp sea un array antes de asignarlo
      if (Array.isArray(resp)) {
        this.lista = resp;
        this.exportarExcel(); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }
    } catch (error) {
      console.error("Error al obtener los datos de entrega detallada:", error);
    }
  }

  async reporteBodegaEntregasDetalldas(bodega: any): Promise<void> {
    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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
      const resp: any = await this.servicio.getMedicamentosBodegaEntregaDetallada(bodega.idBodega, fInicial, fFinal).toPromise();

      // Asegurarse de que resp sea un array antes de asignarlo
      if (Array.isArray(resp)) {
        this.lista = resp;
        this.exportarExcel(); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }
    } catch (error) {
      console.error("Error al obtener los datos de entrega detallada:", error);
    }
  }


  exportarExcel() {  // Crea un array con los datos de la orden de despacho que deseas exportar
    // Crea un array con los datos de la orden de despacho que deseas exportar
    const datos: any[] = [];

    // Encabezados de la tabla
    const encabezado = [
      'TIPO ID',
      'NUMERO DE ID',
      'PRIMER APELLIDO',
      'SEGUNDO APELLIDO',
      'PRIMER NOMBRE',
      'SEGUNDO NOMBRE',
      'FECHA NACIMIENTO',
      'SEXO',
      'ORIGEN DE LA FORMULA',
      'Nº de Formulas Del Paciente',
      'CONTINUIDADES',
      'NOMBRE DEL MEDICAMENTO',
      'VIA DE ADMINISTRACION',
      'FORMA FARMACEUTICA',
      'CANTIDAD PRESCRITA',
      'NUMERO DE DOSIS',
      'PERIODICIDAD',
      'PROGRAMA DE RIESGO',
      'TTIPO DE ACTIVIDAD REALIZADA',
      'CANTIDAD ENTREGADA',
      'DX',
      'REGIMEN',
      'NOMBRE DE LA IPS QUE PRESCRIBE',
      'NOMBRE DEL MEDICO QUE PRESCRIBE',
      'NUMERO DEL REGISTRO MEDICO',
      'DEPARTAMENTO',
      'MUNICIPIO',
      'NOMBRE DE LA FARMACIA',
      'TIPO DE ID',
      'NUMERO DE IDENTIFICACION',
      'NOMBRE DEL USUARIO',
      'CIE-10',
      'Descripción Diagnóstico Principal',
      'DIRECCION',
      'TELEFONO',
      'CUM',
      'Nombre del Medicamento',
      'Fecha de prescripción de la formula',
      'Presentación',
      'Cantidad Prescrita',
      'Cantidad Entregada',
      'Cantidad Pendiente',
      'Nombre del Medicamento Pendiente',
      'Fecha en la que el usuario solicita en la farmacia los medicamentos',
      'Fecha de entrega de los medicamentos',
      'Cuota moderadora y/o Copago',
      'Fecha de entrega real  del medicamento pendiente',
      'Fecha de entrega estimada del medicamento',
      'Medio de entrega del pendiente',
      'Tipo recibe', 'Docuemnto recibe', 'Eps', '¿Es PGP?', 'Id Formula', 'CIE-R1', 'CIE-R2', 'CIE-R3',
      'Observación', 'Estado', 'Funcionario que entrega','PACIENTE PAVE','MEDICAMENTO CONTROLADO','PENDIENTE DEL MEDICAMENTO','PENDIENTE DE LA FORMULA'];

    datos.push(encabezado);
    let fecReal = "";
    let medicamentoPendiente = "";
    // Agrega los items de despacho al array
    console.log(this.lista);
    this.lista.forEach((item: any) => {
      fecReal = "";
      medicamentoPendiente = "";
      if (item.fecEntrega != item.fecSolicitud)
        fecReal = item.fecEntrega;

      if (item.pendiente > 0)
        medicamentoPendiente = item.nombreMedicamento;

      datos.push([
        item.tipoDoc || '',  // Validación si es null o undefined
        item.numDocumento || '',
        item.pApellido || '',
        item.sApellido || '',
        item.pNombre || '',
        item.sNombre || '',
        item.fecNacimiento || '',
        item.sexo || '',
        item.origen || '',
        '',  // número de fórmulas
        (item.continuidadEntrega || '').toUpperCase(),  // Evita errores con toUpperCase
        item.nombreMedicamento || '',
        item.via || '',
        item.forma || '',
        item.cantidadPrescrita || 0,
        (item.frecuencia || '').toUpperCase(),  // Validación para toUpperCase
        (item.duracion ? item.duracion + ' DIAS' : 'N/A'),  // Muestra 'N/A' si está vacío
        item.programaRiesgo || '',
        (item.medioEntrega || '').toUpperCase(),  // Validación para toUpperCase
        item.cantidadEntrega || 0,
        '',  // Dx
        item.regimen || '',
        item.ips || '',
        item.medico || '',
        item.registroMedico || '',
        item.departamento || '',
        item.municipio || '',
        item.bodega || '',  // nombre de la farmacia
        item.tipoDoc || '',
        item.numDocumento || '',
        `${item.pNombre || ''} ${item.sNombre || ''} ${item.pApellido || ''} ${item.sApellido || ''}`,  // Construcción del nombre completo
        item.dxP || '',
        item.dxPDescripcion || '',
        item.direccion || '',
        item.telefono || '',
        item.cum || '',
        item.nombreMedicamento || '',
        item.fecPrescribe || '',
        item.forma || '',
        item.cantidadPrescrita || 0,
        item.cantidadEntrega || 0,
        item.pendiente || 0,
        medicamentoPendiente || '',
        item.fecSolicitud || '',
        item.fecEntrega || '',
        item.cuotaModeradora || 0,
        fecReal || '',
        item.fecEstimada || '',
        (item.medioEntrega || '').toUpperCase(),  // Validación para toUpperCase
        item.tipoRecibe || '',
        item.documentoRecibe || '',
        item.codEps || '',
        item.pgp || '',
        item.idFormula || '',
        item.cieR1 || '',
        item.cieR2 || '',
        item.cieR3 || '',
        item.observacion || '',
        item.estado || '',
        item.funcionario || '',  // Validación para campos que podrían ser nulos
        item.pave || '',  // Validación para campos que podrían ser nulos
        item.controlado || '',  // Validación para campos que podrían ser nulos
        item.controlado || '',  // PENDIENTE DEL MEDICAMENTO
        item.controlado || ''  // PENDIENTE DE LA FORMULA

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
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'Entregas_Detalladas');
    // Genera y descarga el archivo Excel
    XLSX.writeFile(libroDeTrabajo, 'Entrega_Medicamentos_'+ new Date().getTime()+'.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte fue exportado en su carpeta de descargas en formato xslx`,

    });
  }


  async reportePendientesDetalldos(idBodega: number): Promise<void> {
    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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
      console.log(idBodega); 
      const parametrobodega=Number(idBodega);
      console.log(parametrobodega);
      const resp: any = await this.servicio.getMedicamentosPendienteDetallada(parametrobodega, fInicial, fFinal).toPromise();
     
      console.log(resp);
      // Asegurarse de que resp sea un array antes de asignarlo
      if (Array.isArray(resp)) {
        this.lista = resp;
        this.exportarExcelPendientes(); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }
    } catch (error) {
      console.error("Error al obtener los datos de medicamentos pendientes detallados:", error);
    }
  }

  exportarExcelPendientes() {  // Crea un array con los datos de la orden de despacho que deseas exportar
    // Crea un array con los datos de la orden de despacho que deseas exportar
    const datos: any[] = [];

    // Encabezados de la tabla
    const encabezado = [
      'TIPO DE ID',
      'NUMERO DE ID',
      'PRIMER APELLIDO',
      'SEGUNDO APELLIDO',
      'PRIMER NOMBRE',
      'SEGUNDO NOMBRE',
      'NACIMIENTO',
      'SEXO',
      'TÉLEFONO',
      'DIRECCIÓN',
      'DEPARTAMENTO',
      'MUNICIPIO',
      'EPS',
      'REGIMEN',
      'NOMBRE DE LA FARMACIA',
      'NRO. FORMULA',
      'FECHA DE LA FORMULA',
      'NOMBRE DE LA IPS QUE PRESCRIBE',
      'CUM',
      'NOMBRE DEL MEDICAMENTO',
      'VIA DE ADMINISTRACION',
      'FORMA FARMACEUTICA',
      'CANTIDAD PRESCRITA',
      'CANTIDAD ENTREGADA',
      'CANTIDAD PENDIENTE',
      'FECHA DE SOLICITUD',
      'FECHA DE ENTREGA',      
      'FUNCIONARIO QUE ENTREGA',
      'PACIENTE PAVE'
    ];

    datos.push(encabezado);
    let fecReal = "";
    let medicamentoPendiente = "";
    // Agrega los items de despacho al array
    this.lista.forEach((item: any) => {
      fecReal = "";
      medicamentoPendiente = "";
      if (item.fecEntrega != item.fecSolicitud)
        fecReal = item.fecEntrega;

      if (item.pendiente > 0)
        medicamentoPendiente = item.nombreMedicamento;

      datos.push([
        item.tipoDoc || '',  // Validación si es null o undefined
        item.numDocumento || '',
        item.pApellido || '',
        item.sApellido || '',
        item.pNombre || '',
        item.sNombre || '',
        item.fecNacimiento || '',
        item.sexo || '',
        item.telefono || '',
        item.direccion || '',
        item.departamento || '',
        item.municipio || '',
        item.codEps || '',
        item.regimen || '',
        item.bodega || '',  // nombre de la farmacia
        item.idFormula || '',
        item.fecPrescribe || '',      
        item.ips || '',   
        item.cum || '',
        item.nombreMedicamento || '',
        item.via || '',
        item.forma || '',
        item.cantidadPrescrita || 0,
        item.cantidadEntrega || 0,
        item.pendiente || 0,
        item.fecSolicitud || '',
        item.fecEntrega || '',       
        item.funcionario || '',  // Validación para campos que podrían ser nulos       
        item.pave || ''  // Validación para campos que podrían ser nulos       
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
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'Pendientes');
    // Genera y descarga el archivo Excel
    XLSX.writeFile(libroDeTrabajo, 'Medicamentos_Pendientes_'+ new Date().getTime()+'.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte fue exportado en su carpeta de descargas en formato xslx`,

    });
  }



  async reporteFormulasDetalldas(idBodega: number,tipoConsulta: number): Promise<void> {
    const fInicial = this.generalForm.get('fInicial')?.value;
    const fFinal = this.generalForm.get('fFinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
    if (!fInicial || !fFinal) {
      Swal.fire({
        icon: 'error',
        title: `Pendiente!`,
        text: `Falta la informacion de las fechas del periodo que desea generar!`,
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
    
      const parametrobodega=Number(idBodega);
    
      let resp: any;      
      let fileName: string = tipoConsulta === 0 ? "Activas" : "Anuladas";

      resp = tipoConsulta === 0 
      ? await this.servicioFormula.getFormulasDetalladas(parametrobodega, fInicial, fFinal).toPromise()
      : await this.servicioFormula.getFormulasDetalladasAnuladas(parametrobodega, fInicial, fFinal).toPromise();
      // Asegurarse de que resp sea un array antes de asignarlo
      if (Array.isArray(resp)) {
        this.lista = resp;
        this.exportarExcelFormulas(fileName); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }
    } catch (error) {
      console.error("Error al obtener los datos de medicamentos pendientes detallados:", error);
    }
  }

  exportarExcelFormulas(fileName: string) {  // Crea un array con los datos de la orden de despacho que deseas exportar
    // Crea un array con los datos de la orden de despacho que deseas exportar
    const datos: any[] = [];

    // Encabezados de la tabla
    const encabezado = [
      'TIPO DE ID',
      'NUMERO DE ID',
      'PRIMER APELLIDO',
      'SEGUNDO APELLIDO',
      'PRIMER NOMBRE',
      'SEGUNDO NOMBRE',
      'NACIMIENTO',
      'SEXO',
      'EPS',
      'REGIMEN',
      'DEPARTAMENTO',
      'MUNICIPIO',
      'ID DE LA FARMACIA',
      'NRO. FORMULA',
      'FECHA DE LA FORMULA',
      'FECHA DE SOLICITUD',
      'NOMBRE DE LA IPS QUE PRESCRIBE',
      'NOMBRE DEL MEDICO QUE PRESCRIBE',
      'TIPO DE CONTRATO',
      'ORIGEN DE LA FORMULA',
      'CONTINUIDAD',
      'CIE-P',
      'CIE-R1',
      'CIE-R2',
      'CIE-R3',
      'CUOTA MODERADORA',
      'VALOR CUOTA',
      'VALOR DE LA FÓRMULA',
      'NUMERO DE MEDICAMENTOS',
      'FUNCIONARIO QUE CREO LA FÓRMULA',
      'ESTADO DE LA FÓRMULA',
      'FUNCIONARIO QUE ANULÓ LA FÓRMULA',
      'OBSERVACIÓN DE LA FÓRMULA',
      'FECHA DE CREACIÓN',
    ];

    datos.push(encabezado);
    let fecReal = "";
    let medicamentoPendiente = "";
    // Agrega los items de despacho al array
    this.lista.forEach((item: any) => {
      fecReal = "";
      medicamentoPendiente = "";
      if (item.fecEntrega != item.fecSolicitud)
        fecReal = item.fecEntrega;

      if (item.pendiente > 0)
        medicamentoPendiente = item.nombreMedicamento;

      datos.push([
        item.tipoDoc || '',  // Validación si es null o undefined
        item.numDocumento || '',
        item.pApellido || '',
        item.sApellido || '',
        item.pNombre || '',
        item.sNombre || '',
        item.fecNacimiento || '',
        item.sexo || '',
        item.codEps || '',
        item.regimen || '',
        item.departamento || '',
        item.municipio || '',
        item.bodega || '',  // nombre de la farmacia que dispenso el medicamento
        item.idFormula || '',
        item.fecPrescribe || '', 
        item.fecSolicitud || '',      
        item.ips || '',   
        item.medico || '',
        item.tipoContrato || '',
        item.tipoOrigen || '',
        item.continuidad || '',
        item.dxP || '',
        item.cieR1 || '',
        item.cieR2 || '',
        item.cieR3 || '',  // Validación para campos que podrían ser nulos       
        item.cuotaModeradora || '',
        item.valorCuota || '',
        item.valorFormula || '0',
        item.numeroItems || '0',
        item.funcionariocreaformula || '',
        item.estadoFormula || '',
        item.funcionarioanula || '',
        item.observacion || '',
        item.fecCreacion || ''
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
    XLSX.writeFile(libroDeTrabajo, 'Formulas_' + fileName + new Date().getTime()+'.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte fue exportado en su carpeta de descargas en formato xlsx`,

    });
  }


    async exportarExistenciasxlsx(idBodega: number): Promise<void> {   
   
    try {
      const resp: any = await this.servicio.getRegistrosMedicamentoBodega(idBodega).toPromise();
      this.lista = resp;
      this.lista.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));  
      console.log(this.lista);
      if (Array.isArray(resp)) {     
        this.exportarExistenciasXlsx('Existencias'); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }
    } catch (error) {
      console.error("Error al obtener los datos de medicamentos pendientes detallados:", error);
    }
  
  }

  exportarExistenciasXlsx(fileName: string) {  // Crea un array con los datos de la orden de despacho que deseas exportar
    // Crea un array con los datos de la orden de despacho que deseas exportar
    const datos: any[] = [];

    // Encabezados de la tabla
    const encabezado = [
      'CONSECUTIVO',
      'CUM',
      'ID MEDICAMENTO',
      'NOMBRE DEL MEDICAMENTO',
      'PRESENTACION',
      'CANTIDAD EN PLATAFORMA',
      'CANTIDAD FISICA',
      'DIFERENCIA',      
    ];

    datos.push(encabezado);
    // Agrega los items de despacho al array

    this.contador = 0;
    this.lista.forEach((item: any) => {
       this.contador++;
        datos.push([
          this.contador.toString(), // Validación si es null o undefined
          item.cum || "",
          item.idMedicamento,
          item.nombre?.toUpperCase() || "", // Validación para evitar errores si es null o undefined
          item.forma?.toUpperCase() || "",  // Validación para evitar errores si es null o undefined
          item.cantidad
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
    XLSX.writeFile(libroDeTrabajo, 'Inventario_' + new Date().getTime()+'.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Las existencias actuales fueron exportadas en su carpeta de descargas en formato xlsx`,

    });
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

