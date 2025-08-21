import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-formulasdx',
  templateUrl: './formulasdx.component.html',
  styleUrls: ['./formulasdx.component.css']
})
export class FormulasdxComponent {
  listaentregas: any = [];
  parametro: any;
  generalForm!: FormGroup;
  listaregistros: any;
  totalCantidadFormulas: number = 0;
  totalCantidadPacientes: number = 0;
  diagnosticosIds: string[] = [];
  diagnosticosIdsInput: string = '';
  listaCompleta: any = [];



  constructor(
    private servicio: BodegaService,


    private fb: FormBuilder) {
    // Calcula la fecha actual
    const currentDate = new Date();
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 30);
    //  this.spinner.show();
    // Inicializa el formulario y define los FormControl para fechainicial y fechafinal
    this.generalForm = this.fb.group({
      idBodega: [''],
      fInicial: [date30DaysAgo.toISOString().split('T')[0]],
      fFinal: [currentDate.toISOString().split('T')[0]],
      medicamento: [{ value: '', disabled: false }],

    });


  }

  ngOnInit(): void {
    this.parametro = parseInt(sessionStorage.getItem('bodega') || '0', 10);

    this.servicio.getRegistrosActivos().subscribe(
      (resp: any) => {
        this.listaregistros = resp.filter((registro: any) => registro.dispensa === true);
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
        this.buscarRegistro(this.parametro);
      }
    });


  }


  public buscarRegistro(idBodega: number) {
    if (idBodega) {
      // Limpiar listas antes de cargar nueva data
      this.listaentregas = [];
      this.totalCantidadFormulas = 0;
      // Mostrar spinner mientras carga
      this.diagnosticosIdsInput = this.generalForm.get('medicamento')?.value;
      if (this.diagnosticosIdsInput) {
        this.diagnosticosIds = this.diagnosticosIdsInput
          .split(',')
          .map(id => id.trim().toUpperCase())  // quita espacios y convierte a mayúsculas
          .filter(id => id !== '');   // descarta vacíos
      } else {
        this.diagnosticosIds = [];
        return;
      }

      Swal.fire({
        title: 'Cargando registros...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const registro = {
        idBodega: idBodega,
        fInicio: this.generalForm.get('fInicial')?.value,
        fFinal: this.generalForm.get('fFinal')?.value,
        diagnosticos: this.diagnosticosIds
      };


      this.servicio.obtenerFormulasByDx(registro)
        .subscribe((resp: any) => {

          this.listaCompleta = resp;
          this.listaentregas = resp;

          const formulasUnicas = Array.from(
            new Map(resp.map((item: { idFormula: any; }) => [item.idFormula, item])).values()
          );
          this.listaentregas = formulasUnicas;
          this.totalCantidadFormulas = formulasUnicas.length;


          const pacientesUnicos = Array.from(
            new Map(resp.map((item: { numDocumento: string; }) => [item.numDocumento, item])).values()
          );

          this.totalCantidadPacientes = pacientesUnicos.length;

          Swal.close(); // Cierra el spinner



        },
          (error) => {
            console.error('❌ Error cargando registros', error);
            Swal.close(); // 🚨 Primero cerramos el spinner
            Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
          }
        );
      return;
    }

    else {
      Swal.fire({
        icon: 'error',
        title: `Verificar`,
        text: `No ha seleccionado ninguna bodega en donde se va a realizar la busqueda!.`,
      });

    }
  }



  exportarExcelCaptados() {
    // Crea un array con los datos que deseas exportar     
    const datos: any[] = [];
    // Encabezados de la tabla
    const encabezado = [
      'NOMBRE DE LA FARMACIA',
      'FECHA SOLICITUD',
      'TIPO ID',
      'NUMERO DE ID',
      'PRIMER APELLIDO',
      'SEGUNDO APELLIDO',
      'PRIMER NOMBRE',
      'SEGUNDO NOMBRE',
      'FECHA NACIMIENTO',
      'SEXO',
      'DIRECCION',
      'TELEFONO',
      'DEPARTAMENTO',
      'MUNICIPIO',
      'EPS',
      'Nº FORMULA',
      'FECHA PRESCRIPCION',
      'ORIGEN DE LA FORMULA',
      'CONTINUIDADES',
      'CUM',
      'NOMBRE DEL MEDICAMENTO',
      'VIA DE ADMINISTRACION',
      'FORMA FARMACEUTICA',
      'CANTIDAD PRESCRITA',
      'NUMERO DE DOSIS',
      'NOMBRE DE LA IPS QUE PRESCRIBE',
      'NOMBRE DEL MEDICO QUE PRESCRIBE',
      'CIE-10',
      'DESCRIPCION',
      'CIE-R1',
      'CIE-R2',
      'CIE-R3',

    ];

    datos.push(encabezado);

    // Agrega los items de despacho al array
    this.listaCompleta.forEach((item: any) => {

      datos.push([
        item.bodega || '',  // nombre de la farmacia
        item.fecSolicitud || '',
        item.tipoDoc || '',  // Validación si es null o undefined
        item.numDocumento || '',
        item.pApellido || '',
        item.sApellido || '',
        item.pNombre || '',
        item.sNombre || '',
        item.fecNacimiento || '',
        item.sexo || '',
        item.direccion || '',
        item.telefono || '',
        item.departamento || '',
        item.municipio || '',
        item.codEps || '',
        item.idFormula || '',
        item.fecPrescribe || '',
        item.origen || '',
        (item.continuidadEntrega || '').toUpperCase(),  // Evita errores con toUpperCase      
        item.cum || '',
        item.nombreMedicamento || '',
        item.via || '',
        item.forma || '',
        item.cantidadPrescrita || 0,
        (item.frecuencia || '').toUpperCase(),  // Validación para toUpperCase
        item.ips || '',
        item.medico || '',
        item.dxP || '',
        item.dxPDescripcion || '',
        item.cieR1 || '',
        item.cieR2 || '',
        item.cieR3 || '',
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
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'detallado');
    // Genera y descarga el archivo Excel
    XLSX.writeFile(libroDeTrabajo, 'Pacientes_DX' + new Date().getTime() + '.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte fue exportado en su carpeta de descargas en formato xlsx`,

    });
  }




  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

  reporteEnConstruccion() {
    Swal.fire({
      icon: 'info',
      title: `En construcción!`,
      text: `El reporte esta en proceso de construcción, te estaremos informando cuando esté disponible!`,
    });
  }


}


