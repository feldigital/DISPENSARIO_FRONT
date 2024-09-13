import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { BodegaI } from 'src/app/modelos/bodega.model';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

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

  constructor(
    private fb: FormBuilder,
    private servicio: BodegaService
  ) {


    this.mostrarActivos();
    this.nombrebtn = "Crear";
    this.banderaRegistro = false;
    this.cargarDepartamentos();
  }

  ngOnInit(): void {
    this.crearFormulario();
  }

  onDptoSeleccionado() {
    const dptoSeleccionado = this.generalForm.get('departamento')?.value;
    console.log(dptoSeleccionado);
    this.servicio.getMunicipiosDepartamento(dptoSeleccionado).subscribe((resp: any) => {
      this.listaMpio = resp;
      console.log(this.listaMpio);
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
  /*
    cargarRegistros() {
      this.servicio.getRegistrosActivos()
        .subscribe((resp: any) => {
          this.listaregistros = resp;
          console.log(resp);
        },
          (err: any) => { console.error(err) }
        );
    }*/

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
      });
  }



  mostrarRegistro(itemt: any) {

    this.nombrebtn = "Actualizar"
    this.servicio.getMunicipiosDepartamento(itemt.departamento).subscribe(
      (municipios: any[]) => {
        this.listaMpio = municipios;

        // Una vez cargados los municipios, establece los valores del formulario

        this.generalForm.setValue({
          idBodega: itemt.idBodega,
          nombre: itemt.nombre,
          puntoEntrega: itemt.puntoEntrega,
          departamento: itemt.departamento,
          municipio: itemt.municipio,
          direccion: itemt.direccion,
          telefono: itemt.telefono,
          email: itemt.email,
          estado: itemt.estado,
        })
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
        console.log(this.generalForm.value);
        this.servicio.update(this.generalForm.value).subscribe(ciclo => {
          this.mostrarActivos();
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



  reportePendientes(bodega: any): void {
    this.datosPendientes(bodega).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;

      autoTable(doc, {
        head: [['Nro', 'CUM', 'Nombre del medicamento', 'Presentación', 'Cantidad pendiente']],
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




  private async datosPendientes(bodega: any): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
      const resp: any = await this.servicio.getMedicamentosBodegaPendiente(bodega.idBodega, '2024-01-01', '2024-12-31').toPromise();
      this.lista = resp;
      this.lista.sort((a: any, b: any) => b.nombre - a.nombre);

      for (let i = 0; i < this.lista.length; i++) {
        const rowData: RowInput = [
          (i + 1).toString(),
          this.lista[i].cum,
          this.lista[i].nombre,
          this.primerasmayusculas(this.lista[i].forma),
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



  reporteExistenciasActuales(bodega: any): void {
    this.datosExistencia(bodega).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;

      autoTable(doc, {
        head: [['Nro', 'CUM', 'Nombre del medicamento', 'Presentación', 'Cantidad existente']],
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


  private async datosExistencia(bodega: any): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
      const resp: any = await this.servicio.getRegistrosMedicamentoBodega(bodega.idBodega).toPromise();
      this.lista = resp;
      this.lista.sort((a: any, b: any) => b.nombre - a.nombre);
      //const data = [];
      for (let i = 0; i < this.lista.length; i++) {
        const rowData: RowInput = [
          (i + 1).toString(),
          this.lista[i].cum,
          this.lista[i].nombre,
          this.primerasmayusculas(this.lista[i].forma),
          this.lista[i].cantidad,
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
      return accum + (current[columna] ? 1 : 0);
    }, 0);
    return total.toString();
  }


  public reporteBodega(itemt: any) {

    console.log(itemt);
    Swal.fire({
      icon: 'info',
      title: `En construcción`,
      text: `Reporte en construcción....`,
    });
  }


  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }


}

