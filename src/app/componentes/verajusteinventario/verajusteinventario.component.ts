import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AjusteinventarioService } from 'src/app/servicios/ajusteinventario.service';



@Component({
  selector: 'app-verajusteinventario',
  templateUrl: './verajusteinventario.component.html',
  styleUrls: ['./verajusteinventario.component.css']
})
export class VerajusteinventarioComponent {

  listaAjusteInventario: any; 
  listaregistros: any; 
  listaItemAjuste: any;
  consultaSeleccionada: string = '';
  generalForm!: FormGroup;
  idBodegaSeleccionada: string = '';
  idBodegausuario: boolean = false;
  contador: number=0;
  lista: any = [];
  ajusteActual: any = null;
  parametro: any;

  constructor(  
    private fb: FormBuilder,
    private ajusteInventarioservicio: AjusteinventarioService,
    private bodegaservicio: BodegaService,
  ) { 
    // Calcula la fecha actual
    const currentDate = new Date();      
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 90);

    this.generalForm = this.fb.group
    ({        
      idBodega: [''],       
      fInicial: [date30DaysAgo.toISOString().split('T')[0]],
      fFinal: [currentDate.toISOString().split('T')[0]],    
    });
   

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
        // Establecer el valor del select después de que se cargan los registros
        if (this.parametro) {
          this.generalForm.patchValue({ idBodega: +this.parametro });          
        }
      },
      (err: any) => {
        console.error(err);
      }
    );
        // Escuchar cambios en el select de bodegas
        this.generalForm.get('idBodega')!.valueChanges.subscribe((nuevoIdBodega: number) => {
          if (nuevoIdBodega) {
            this.parametro = nuevoIdBodega;               
              this.consultarAjusteInventario(this.parametro);   
          }
        });
    
       // this.generalForm.patchValue({ idBodega: this.parametro });    
  }

  buscarAjusteInventario(){   
    const bodegaId = this.generalForm.get('idBodega')?.value;
    this.idBodegaSeleccionada = bodegaId;
    const bodegaString = sessionStorage.getItem("bodega");
    this.idBodegausuario = bodegaString == bodegaId ? true : false;    
    this.consultarAjusteInventario(bodegaId);     
  } 
  
  
  consultarAjusteInventario(bodegaId: number) { 
    if (!bodegaId || isNaN(bodegaId) || bodegaId === 0) {
      console.warn('❌ ID inválido para buscar registros:', bodegaId);
      return; // Salir sin hacer nada
    }
    this.ajusteActual=null;
    this.listaItemAjuste={};
     Swal.fire({
              title: 'Cargando registros...',
              html: 'Por favor espera un momento',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });
    this.ajusteInventarioservicio.getAjusteInventarioBodega(bodegaId,this.generalForm.get('fInicial')?.value, this.generalForm.get('fFinal')?.value)
      .subscribe(resp => {
        this.listaAjusteInventario = resp;
        this.listaAjusteInventario.sort((a: any, b: any) => {
          return new Date(b.fechaDespacho).getTime() - new Date(a.fechaDespacho).getTime();
        });
        
       Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
                },
                (error) => {
                  console.error('❌ Error cargando registros', error);
                  Swal.close(); // 🚨 Primero cerramos el spinner
                  Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
                }
              );
  }


  public eliminarAjusteInventario(itemt: any) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `La orden de ajuste de existencias por inventario Nro. ` + itemt.idAjuste  + ` a la bodega ` + itemt.bodegaAjuste.nombre+ ` de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ajusteInventarioservicio.delete(itemt.idAjuste).subscribe(resp => {
          this.listaAjusteInventario = this.listaAjusteInventario.filter((cli: any) => cli !== itemt);
          this.ajusteActual=null;
          this.listaItemAjuste={};
          Swal.fire({
            icon: 'success',
            title: 'Ok',
            text: 'La orden de ajuste de existencias por inventario Nro. ' + itemt.idAjuste  + ' a la bodega ' + itemt.bodegaAjuste.nombre + ' ha sido eliminado correctamente',
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


  async salidasExcelDetalleAjuste(): Promise<void> {
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
    
      const parametrobodega=Number(idBodega);
    
      let resp: any;           
      
      let fileName: string = "";
      //resp =  await this.ajusteInventarioservicio.getDetalleOrdenDespacho(parametrobodega, fInicial, fFinal,tipoReporte).toPromise();

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
      'CANTIDAD AJUSTE',
      'ID ORDEN AJUSTE',
      'FECHA AJUSTE',
      'ESTADO',
      'BODEGA',      
      'FUNCIONARIO AJUSTE',
      'FUNCIONARIO INVENTARIO',
      
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
    XLSX.writeFile(libroDeTrabajo, 'Relacion_Ajuste_' + fileName + new Date().getTime()+'.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte de los ajustes fue exportado en su carpeta de descargas en formato xslx`,

    });
  }


  private calcularTotal(columna: string): string {
    const total = this.listaItemAjuste.reduce((accum: number, current: any) => {
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
      //console.warn("El nivel del usuario no es válido o no está definido");
      return false;
    }  
    return nivelUsuario >= nivelRequerido;
  }


  mostrarItemAjuste(item: any): void {
    
    this.listaItemAjuste = item.itemsAjuste.sort((a: any, b: any) => {
      return a.medicamento.nombre.localeCompare(b.medicamento.nombre);
    });
    this.ajusteActual=item;
    
  }
 
  addJustifiedText = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void => {
    const splitText = doc.splitTextToSize(text, maxWidth);
    let yPosition = y;
  
    splitText.forEach((line: string, index: number) => {
      let words = line.split(" ");
      let spaceCount = words.length - 1;
  
      if (spaceCount > 0 && index !== splitText.length - 1) {  
        let textWidth = doc.getTextWidth(line);
        let extraSpace = (maxWidth - textWidth) / spaceCount;
  
        let justifiedLine = words[0]; // Inicia con la primera palabra
        for (let i = 1; i < words.length; i++) {
          justifiedLine += " " + " ".repeat(extraSpace) + words[i]; // Agrega espacio extra entre palabras
        }
  
        doc.text(justifiedLine, x, yPosition);
      } else {
        doc.text(line, x, yPosition);
      }
  
      yPosition += lineHeight;
    });
  };
  
 

  
  actaAjustePDF(idAjuste:any): void {
    this.datosActaAjuste(idAjuste).then((bodyData) => {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      let totalPagesExp = '{total_pages_count_string}';
      let paginaActual = 1;
      let corte = "Periodo del reporte del" ;

      const self = this; 
      
      autoTable(doc, {
        head: [['Nro', 'ID', 'Nombre del medicamento',  'Física', 'Plataforma','Diferencia +/-']],
        body: bodyData,
        startY: 119,
        //theme: 'striped',
        theme: 'grid',

        willDrawPage: function (data) {
           doc.setFontSize(11);
          //doc.setFont("helvetica", "bold");
          doc.setDrawColor(0);
         
          let titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('ACTA DE AJUSTE DE INVENTARIO DE MEDICAMENTOS') / 2);
          let titleYPos = doc.getTextWidth('ACTA DE AJUSTE DE INVENTARIO DE MEDICAMENTOS');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 9, titleYPos + 20, 7, 3, 3, "FD");        

         
          doc.addImage('/assets/logo.png', 'JPEG', 180, 16, 25, 20);
          //doc.setTextColor('#FFFFFF'); // Color blanco

          doc.text('ACTA DE AJUSTE DE INVENTARIO DE MEDICAMENTOS', titleXPos, 14);
          // Establecer el color de la letra y el estilo de la fuente para el segundo texto
          
            
          titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth("NUMERO: "+ idAjuste.idAjuste + "-" +idAjuste.fechaAjuste) / 2);
          titleYPos = doc.getTextWidth("NUMERO: "+ idAjuste.idAjuste + "-" +idAjuste.fechaAjuste);
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, 17, titleYPos + 20, 7, 3, 3, "FD");   
          doc.text("NUMERO: "+ idAjuste.idAjuste+ "-" +idAjuste.fechaAjuste , titleXPos, 22);

          doc.setTextColor('#000000'); // Color negro  #E5E5E5

          doc.text('Fecha de ajuste:', 10, 30);        
          doc.text(idAjuste.fechaAjuste, 70, 30);        
          doc.text('Responsable del ajuste:', 10, 35);
          doc.text(idAjuste.funcionarioAjuste, 70, 35);
          doc.text('Fecha del inventario:', 10, 40);
          doc.text(idAjuste.fechaInventario, 70, 40);
          doc.text('Responsable del inventario:', 10, 45);
          doc.text(idAjuste.funcionarioInventario, 70, 45);
          doc.text('Nombre de la bodega:', 10, 50);
          doc.text(idAjuste.bodegaAjuste.nombre, 70, 50);        

          let texto = "En la fecha indicada, se procede a la realización del presente Acta de Ajuste de Inventario, con el propósito de documentar las diferencias encontradas en los medicamentos entre la existencia física y la existencia en la plataforma de dispensación de la IPS SERVICIOS INTEGRALES DE SALUD DEL MAGDALENA."
          let nuevaY=60;
          let parrafo1 = doc.splitTextToSize(texto, 190);
          self.addJustifiedText(doc, texto, 10, nuevaY, 190, 6);
          
          texto = "Durante el proceso de verificación llevado a cabo el día " + idAjuste.fechaInventario + ", se identificaron discrepancias en las cantidades registradas, motivo por el cual se realiza el siguiente ajuste:";
          nuevaY = nuevaY + (parrafo1.length * 6) + 6; // +10 para margen
          parrafo1 = doc.splitTextToSize(texto, 190);
          self.addJustifiedText(doc, texto, 10, nuevaY, 190, 6);            

          texto = "MOTIVOS DEL AJUSTE: " +idAjuste.observacionAjuste;
          nuevaY = nuevaY + (parrafo1.length * 6) + 6; // +10 para margen
          parrafo1 = doc.splitTextToSize(texto, 190);          
          self.addJustifiedText(doc, texto, 10, nuevaY, 190, 6);           
          
          nuevaY = nuevaY + (parrafo1.length * 6) + 6; // +10 para margen
          
          titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth('RELACIÓN DE MEDICAMENTOS AJUSTADOS') / 2);
          titleYPos = doc.getTextWidth('RELACIÓN DE MEDICAMENTOS AJUSTADOS');
          doc.setDrawColor('#D3E3FD');
          doc.setFillColor('#D3E3FD');
          doc.roundedRect(titleXPos - 10, nuevaY-10, titleYPos + 20, 7, 3, 3, "FD");    
          doc.text("RELACIÓN DE MEDICAMENTOS AJUSTADOS", titleXPos, nuevaY-5); 
          //doc.setTextColor('#000000'); // Color negro
        },
        didDrawPage: function (data) {
          doc.setFontSize(10);
          doc.text('Página ' + paginaActual + ' de ' + totalPagesExp, 170, doc.internal.pageSize.height - 10);
          doc.text('CALLE 24 #18A-101 Barrio Santa Catalina', 12, doc.internal.pageSize.height - 12);
          doc.text('Cel: 3004407974, Email: npizarro@sism.com.co', 12, doc.internal.pageSize.height - 7);
          doc.setLineWidth(1.3);
          doc.setDrawColor(236, 255, 83); // draw red lines 
          doc.line(10, doc.internal.pageSize.height - 20, 10, doc.internal.pageSize.height - 5);
          
          // Agregar espacio antes de las firmas
          let finalY = data.cursor!.y + 30;

          let texto = "La presente acta se realiza con el fin de formalizar y documentar los ajustes necesarios para la correcta administración del inventario de los medicamentos.";
          self.addJustifiedText(doc, texto, 10, finalY-25, 190, 6);            

          
          // Firmas
          doc.setLineWidth(0.3);
          doc.setDrawColor(0, 0, 0); // draw red lines 
          doc.line(10, finalY, 70, finalY); // Línea firma izquierda
          doc.line(100, finalY, 180, finalY); // Línea firma derecha
          
          doc.setFontSize(10);
          doc.text('Responsable del Ajuste', 15, finalY + 5);
          doc.text(idAjuste.funcionarioAjuste, 15, finalY + 10);
      
          doc.text('Responsable del Inventario', 105, finalY + 5);
          doc.text(idAjuste.funcionarioInventario, 105, finalY + 10);
          
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


  private async datosActaAjuste(ajuste: any): Promise<RowInput[] | undefined> {
    const data: RowInput[] = [];
    try {
     // const resp: any = await this.servicioFormula.getFormulasNoProcesadas(idBodega,fInicial, fFinal).toPromise();
      this.lista = ajuste.itemsAjuste.sort((a: any, b: any) => {
        return a.medicamento.nombre.localeCompare(b.medicamento.nombre);
      });
      //this.lista.sort((a: any, b: any) => b.nombre - a.nombre);     
      this.contador = 0;;
      for (let i = 0; i < this.lista.length; i++) {
        const rowData: RowInput = [
          (i + 1).toString(),
          `${this.lista[i].medicamento.idMedicamento ?? ''}`, 
          `${this.lista[i].medicamento.nombre ?? ''}`, 
          this.lista[i].cantidadFisica ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
          this.lista[i].cantidadSistema ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
          this.lista[i].cantidadAjuste ?? '', // Verifica si existe y luego lo convierte, si no, coloca un valor por defecto
          ];
        data.push(rowData);
      }      
      return data.length > 0 ? data : undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  reporteEnConstruccion() {
    Swal.fire({
      icon: 'info',
      title: `En construcción!`,
      text: `El reporte esta en proceso de construcción, te estaremos informando cuando esté disponible!`,
    });
  }

}
