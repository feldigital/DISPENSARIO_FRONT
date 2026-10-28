import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';
import { FormulaService } from 'src/app/servicios/formula.service';
import * as XLSX from 'xlsx';
import { debounceTime, map, Observable, of, switchMap } from 'rxjs';
import { PacienteService } from 'src/app/servicios/paciente.service';


@Component({
  selector: 'app-estadistica',
  templateUrl: './estadistica.component.html',
  styleUrls: ['./estadistica.component.css']
})
export class EstadisticaComponent {

  listaentregas: any = [];
  parametro: any;
  generalForm!: FormGroup;
  listaregistros: any;
  registrosFiltrados: any = [];

  listarEps: any;
  epsSeleccionadas: any[] = [];
  visorTabla: any;
  totalCantidadTotal: number = 0;
  totalCantidadParcial: number = 0;
  columnas: any = [];
  tipoCalculo: string = "PORCENTAJE";
  medicamentosFiltrados: any[] = [];
  lista: any = [];

  constructor(
    private servicio: BodegaService,
    private formulaService: FormulaService,
    private pacienteService: PacienteService,

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
      fechainicial: [date30DaysAgo.toISOString().split('T')[0]],
      fechafinal: [currentDate.toISOString().split('T')[0]],
      medicamento: [''],
      paciente: [''],
      eps: [''],
      reporte: [''],
      checkMedicamento: [''],

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


    this.pacienteService.getEps().subscribe(
      (resp: any) => {
        this.listarEps = resp;
        // Seleccionar todas las EPS al iniciar
        this.generalForm.get('eps')?.setValue([
          0,
          ...this.listarEps.map((e: any) => e.codigo)
        ]);
      },
      (err: any) => {
        console.error(err);
      }
    );


    // Escuchar cambios en el select de bodegas
    this.generalForm.get('idBodega')!.valueChanges.subscribe((nuevoIdBodega: number) => {
      if (nuevoIdBodega) {
        this.parametro = nuevoIdBodega;
        // this.buscarRegistro( this.parametro);       
      }
    });

    this.generalForm.get('medicamento')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir    
        map(value => {
          if (typeof value === 'string') {
            return value.trim().toLowerCase();
          } else if (value && typeof value === 'object' && 'nombre' in value) {
            return value.nombre.toLowerCase(); // si ya seleccionó un medicamento
          } else {
            return '';
          }
        }),
        switchMap(query => {
          if (query.length >= 3) {
            return this.formulaService.filtrarMedicamentos(query);
          } else {
            return of([]);
          }
        })
      )
      .subscribe(results => {
        this.medicamentosFiltrados = results;
      });


    this.generalForm.get('checkMedicamento')?.valueChanges.subscribe(valor => {
      if (!valor) {
        this.generalForm.patchValue({
          medicamento: null
        });
      }
    });


  }

  onOptionSelectedMedicamento(option: any) {
    this.generalForm.get('medicamento')?.setValue(option);
  }

  displayMedicamento(medicamento?: any): string {
    return medicamento ? medicamento.nombre : '';
  }


  buscarPorMedicamento(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.trim().length > 3) {
      const palabras = filterValue.toLowerCase().trim().split(/\s+/); // dividir por espacios
      const filteredResults = this.listaentregas.filter((item: any) => {
        const nombre = item.nombreMedicamento.toLowerCase();
        // Verificar que todas las palabras estén en el nombre
        return palabras.every(palabra => nombre.includes(palabra));
      });
      return of(filteredResults);
    }
    // Si no hay filtro, devolver la lista completa
    return of(this.listaentregas);
  }


  buscarPorPaciente(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.trim().length > 3) {
      const palabras = filterValue.toLowerCase().trim().split(/\s+/); // dividir por espacios
      const filteredResults = this.listaentregas.filter((item: any) => {
        const nombre = item.pNombre.toLowerCase();
        // Verificar que todas las palabras estén en el nombre
        return palabras.every(palabra => nombre.includes(palabra));
      });
      return of(filteredResults);
    }
    // Si no hay filtro, devolver la lista completa
    return of(this.listaentregas);
  }

  public buscarRegistro(idBodega: number) {
    if (idBodega) {
      // Limpiar listas antes de cargar nueva data
      this.listaentregas = [];
      this.registrosFiltrados = [];
      this.totalCantidadTotal = 0;
      this.totalCantidadParcial = 0;
      // Mostrar spinner mientras carga
      Swal.fire({
        title: 'Cargando registros...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.formulaService.getMedicamentoentregadoPacientePendiente(idBodega, this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value)
        .subscribe((resp: any) => {
          this.listaentregas = resp;
          this.registrosFiltrados = this.listaentregas;

          Swal.close(); // ✅ Cerrar el spinner al terminar correctamente          
          const totalEntregado = this.registrosFiltrados.reduce((sum: number, item: any) => {
            return sum + (item.cantidadEntrega || 0); // usa 0 si el valor es null/undefined
          }, 0);

          this.totalCantidadParcial = totalEntregado;
        },
          (error) => {
            console.error('❌ Error cargando registros', error);
            Swal.close(); // 🚨 Primero cerramos el spinner
            Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
          }
        );
    }
    else {
      Swal.fire({
        icon: 'error',
        title: `Verificar`,
        text: `No ha seleccionado el medicamento sobre el cual va a realizar la busqueda!.`,
      });

    }
  }


  async reporteEntregadosDetalldos(idBodega: number): Promise<void> {
    const fInicial = this.generalForm.get('fechainicial')?.value;
    const fFinal = this.generalForm.get('fechafinal')?.value;
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
      // Mostrar spinner mientras carga
      Swal.fire({
        title: 'Cargando registros...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Esperar la promesa con await       
      const parametrobodega = Number(this.parametro);
      const resp: any = await this.formulaService.getMedicamentoentregadoPacientePendiente(parametrobodega, this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value).toPromise();

      Swal.close(); // 🚨 Primero cerramos el spinner
      // Asegurarse de que resp sea un array antes de asignarlo
      if (Array.isArray(resp)) {
        this.listaentregas = resp;

        this.exportarExcelEntregados(); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }

    } catch (error) {
      console.error("Error al obtener los datos de las entregas del medicamentos seleccionado:", error);
      Swal.close(); // 🚨 Primero cerramos el spinner
      Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
    }
  }

  exportarExcelEntregados() {  // Crea un array con los datos de la orden de despacho que deseas exportar
    // Crea un array con los datos de la orden de despacho que deseas exportar


    const datos: any[] = [];
    // Encabezados de la tabla
    const encabezado = [
      'NOMBRE DE LA FARMACIA',
      'TIPO DE ID',
      'NUMERO DE ID',
      'PRIMER APELLIDO',
      'SEGUNDO APELLIDO',
      'PRIMER NOMBRE',
      'SEGUNDO NOMBRE',
      'PACIENTE PAVE',
      'EPS',
      'ID MEDICAMENTO',
      'NOMBRE DEL MEDICAMENTO',
      'NRO. FORMULA',
      'FECHA DE SOLICITUD',
      'FECHA DE ENTREGA',
      'CANTIDAD ENTREGADA',
      'DIAS DE ENTREGA',
      'FUNCIONARIO ENTREGADA',
      'PROCESO',
      'OBSERVACION'
    ];

    datos.push(encabezado);

    // Agrega los items de despacho al array
    this.listaentregas.forEach((item: any) => {

      const fechaSolicitud = new Date(item.fecSolicitud);
      const fechaEntrega = new Date(item.fecEntrega);

      // Elimina la hora
      fechaSolicitud.setHours(0, 0, 0, 0);
      fechaEntrega.setHours(0, 0, 0, 0);

      const diasEntrega = Math.round(
        (fechaEntrega.getTime() - fechaSolicitud.getTime()) / (1000 * 60 * 60 * 24)
      );

      datos.push([
        item.bodegaEntrega || '',  // Validación si es null o undefined
        item.tipoDoc || '',  // Validación si es null o undefined
        item.numDocumento || '',
        item.pApellido || '',
        item.sApellido || '',
        item.pNombre || '',
        item.sNombre || '',
        item.pave || '',  // Validación para campos que podrían ser nulos 
        item.eps || '',
        item.idMedicamento || '',
        item.nombreMedicamento || '',
        item.idFormula || '',
        this.formatFechaCorta(item.fecSolicitud) || '',
        this.formatFechaHora(item.fecEntrega) || '',
        item.cantidadEntrega || 0,
        diasEntrega,
        item.funcionarioEntrega || 0,
        this.formatFechaCorta(item.fecProceso) || '',
        item.medioEntrega || 0
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
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'Detalle');
    // Genera y descarga el archivo Excel
    XLSX.writeFile(libroDeTrabajo, 'Pendientes_Entregados_' + new Date().getTime() + '.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte fue exportado en su carpeta de descargas en formato xslx`,

    });
  }

  formatFechaCorta(fecha: Date | string): string {
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const año = d.getFullYear();
    return `${dia}/${mes}/${año}`;
  }

  public formatFechaHora(fecha: any): string {
    if (!fecha) {
      return '';
    }
    const d = new Date(fecha);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')
      }/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')
      }:${String(d.getMinutes()).padStart(2, '0')}`;
  }



  public ejecutarReporte(): void {
    const reporte = this.generalForm.get('reporte')?.value;
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    this.columnas = [];
    this.tipoCalculo = "PORCENTAJE";
    switch (reporte) {
      case 'PENDIENTES':

        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Fórmulas' },
          { titulo: 'Cantidad Entregada' },
          { titulo: '% Porcentaje' }];
        this.reporteEnConstruccion();
        break;
      case 'ENTREGA_PENDIENTES':
        this.tipoCalculo = "PROMEDIO";
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Cantidad de Medicamentos entregados' },
          { titulo: 'Total de Pendientes Entregados' },
          { titulo: 'Relación' }];

        this.ejecutarReporteEntregaPendiente();
        break;

      case 'MENSAJES':
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Fórmulas' },
          { titulo: 'Cantidad Entregada' },
          { titulo: '% Porcentaje' }];
        this.reporteEnConstruccion();
        break;

      case 'SUBSANACION':

        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Items Fórmulas' },
          { titulo: 'Total Items Subsanados' },
          { titulo: '% Porcentaje' }];
        this.ejecutarReporteSubsanados();
        break;

      case 'PROXIMOS':
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Fórmulas' },
          { titulo: 'Cantidad Entregada' },
          { titulo: '% Porcentaje' }];
        this.reporteEnConstruccion();
        break;

      case 'PROMEDIO':
        this.tipoCalculo = "PROMEDIO";
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total de Medicamentos' },
          { titulo: 'Total de Fórmulas' },
          { titulo: 'Promedio de Medicamentos X Formula' }];
        this.ejecutarReporteMedicamentoPromedio();
        break;

      case 'ENTREGADOS':
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Prescritos' },
          { titulo: 'Sub total entregados' },
          { titulo: '% Porcentaje' }];
        this.ejecutarReporteMedicamentoEntregado();
        break;

      case 'COMPLETAS':
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Fórmulas' },
          { titulo: 'Cantidad Entregada' },
          { titulo: '% Porcentaje' }];
        this.reporteEnConstruccion();
        break;

      case 'EDITADAS':
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Fórmulas' },
          { titulo: 'Cantidad Editadas' },
          { titulo: '% Porcentaje' }];
        this.ejecutarReporteEditadas();
        break;

      case 'ANULADAS':
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Fórmulas' },
          { titulo: 'Cantidad Anuladas' },
          { titulo: '% Porcentaje' }];
        this.ejecutarReporteAnuladas();
        break;

      case 'CON_SOPORTE':
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Fórmulas' },
          { titulo: 'Cantidad con Soportes' },
          { titulo: '% Porcentaje' }];
        this.ejecutarReporteSinSoporte();
        break;

      case 'PQRS':
        this.columnas = [
          { titulo: 'Nombre del Dispensario' },
          { titulo: 'Total Fórmulas' },
          { titulo: 'Cantidad con PQRS' },
          { titulo: '% Porcentaje' }];
        this.ejecutarReportePqrs();
        break;

      case 'TOP_IPS':
        this.columnas = [
          { titulo: 'Nombre de la IPS' },
          { titulo: 'Total Fórmulas Prescritas' }];
        this.ejecutarReporteTopIps();
        break;

      case 'TOP_MEDICAMENTOS_F':
        this.columnas = [
          { titulo: 'Nombre del medicamento' },
          { titulo: 'Nro. de Formulas Prescritas' }
        ];
        this.ejecutarReporteTopMedicamentoFrecuencia();
        break;

      case 'TOP_MEDICAMENTOS_C':
        this.columnas = [
          { titulo: 'Nombre del medicamento' },
          { titulo: 'Cantidades Prescritas' }];
        this.ejecutarReporteTopMedicamentoCantidad();
        break;


      case 'TOP_MEDICOS':
        this.columnas = [
          { titulo: 'Nombre del Profesional' },
          { titulo: 'Especialidad' },
          { titulo: 'Total Fórmulas Prescritas' },
          { titulo: 'Total de IPS' }];

        this.ejecutarReporteTopMedico(this.generalForm.get('checkMedicamento')?.value);
        break;

      default:
        Swal.fire({
          icon: 'warning',
          title: 'Seleccione un reporte',
          text: 'Debe seleccionar el reporte que desea consultar.'
        });
        break;
    }
    console.log(this.visorTabla);

  }




  public ejecutarReporteSinSoporte(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteSinSoporte(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }

  public ejecutarReporteEditadas(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteEditadas(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }

  public ejecutarReporteAnuladas(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteAnuladas(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }

  public ejecutarReportePqrs(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReportePqrs(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }

  public ejecutarReporteMedicamentoEntregado(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteMedicamentoEntregado(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }

  public ejecutarReporteTopIps(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteTopIps(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }

  public ejecutarReporteTopMedico(medicamento: boolean): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    let request;
    if (medicamento) {
      console.log(this.generalForm.get('medicamento')?.value);
      const idMedicamento = this.generalForm.get('medicamento')?.value?.idMedicamento;
      console.log(idMedicamento);

      if (!idMedicamento) {
        Swal.close();
        Swal.fire(
          'Medicamento requerido',
          'Debe seleccionar un medicamento para generar este reporte.',
          'warning'
        );
        return;
      }
      request = this.formulaService.getReporteTopMedicoMedicamento(
        this.parametro,
        this.generalForm.get('fechainicial')?.value,
        this.generalForm.get('fechafinal')?.value,
        idMedicamento,
        this.generalForm.get('eps')?.value

      );

    } else {

      request = this.formulaService.getReporteTopMedico(
        this.parametro,
        this.generalForm.get('fechainicial')?.value,
        this.generalForm.get('fechafinal')?.value,
        this.generalForm.get('eps')?.value
      );
    }
    request.subscribe(
      (resp: any) => {
        this.visorTabla = resp;

        this.visorTabla = resp.map((item: any) => {

          const [nombre, resto] = item.nombreBodega.split(" - ");
          const [especialidad, idTexto] = resto.split(" | ");

          return {
            ...item,
            nombreMedico: nombre,
            especialidad,
            idMedico: Number(idTexto)
          };

        });



        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );

        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;

        Swal.close();

      },
      (error: any) => {
        Swal.close();
        Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
      }
    );
  }

  public ejecutarReporteTopMedicamentoFrecuencia(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteTopMedicamentoFrecuencia(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }


  public ejecutarReporteTopMedicamentoCantidad(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteTopMedicamentoCantidad(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }

  public ejecutarReporteMedicamentoPromedio(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteMedicamentoPromedio(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }

  public ejecutarReporteEntregaPendiente(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteEntregaPendiente(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }

  public ejecutarReporteSubsanados(): void {
    this.visorTabla = [];
    this.totalCantidadTotal = 0;
    this.totalCantidadParcial = 0;
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    this.formulaService.getReporteSubsanacionAdministrativa(
      this.parametro,
      this.generalForm.get('fechainicial')?.value,
      this.generalForm.get('fechafinal')?.value,
      this.generalForm.get('eps')?.value
    ).subscribe(
      (resp: any) => {
        this.visorTabla = resp;
        console.log(resp);
        // Calcular totales
        const totales = this.visorTabla.reduce(
          (acc: any, item: any) => ({
            total: acc.total + Number(item.cantidadTotal || 0),
            parcial: acc.parcial + Number(item.cantidadParcial || 0)
          }),
          { total: 0, parcial: 0 }
        );
        this.totalCantidadTotal = totales.total;
        this.totalCantidadParcial = totales.parcial;
        Swal.close();
      },
      (error: any) => {
        console.error('❌ Error cargando registros', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudieron cargar los registros.',
          'error'
        );
      }
    );
  }


  public exportarReporte(): void {
    const reporte = this.generalForm.get('reporte')?.value;
    switch (reporte) {
      case 'PENDIENTES':
        this.reporteEnConstruccion();
        break;
      case 'ENTREGA_PENDIENTES':
        this.reporteEntregadosDetalldos(this.parametro);
        break;

      case 'MENSAJES':
        this.reporteEnConstruccion();
        break;

      case 'VENCIDOS':
        this.reporteEnConstruccion();
        break;

      case 'PROXIMOS':
        this.reporteEnConstruccion();
        break;

      case 'NOROTAN':
        this.reporteEnConstruccion();
        break;

      case 'ENTREGADOS':
        this.reporteEnConstruccion();
        break;

      case 'COMPLETAS':
        this.reporteEnConstruccion();
        break;

      case 'EDITADAS':
        this.reporteFormulasDetalldasEstadistica();
        break;

      case 'ANULADAS':
        this.reporteEnConstruccion();
        break;

      case 'CON_SOPORTE':
        this.reporteFormulasDetalldasEstadistica();
        break;

      case 'PQRS':
        this.reporteEnConstruccion();
        break;

      case 'TOP_IPS':
        this.reporteFormulasDetalldasEstadistica();
        break;

      case 'TOP_MEDICAMENTOS_F':
        this.reporteEnConstruccion();
        break;

      case 'TOP_MEDICAMENTOS_C':
        this.reporteEnConstruccion();
        break;

      case 'TOP_MEDICOS':
        this.reporteFormulasDetalldasEstadistica();
        break;

      default:
        Swal.fire({
          icon: 'warning',
          title: 'Seleccione un reporte',
          text: 'Debe seleccionar el reporte que desea consultar.'
        });
        break;
    }

  }




  public verIps(itemt: any, medicamento: boolean) {

    Swal.fire({
      title: 'Consultando IPS...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    let mensaje = `Medico que prescribe: <b>${itemt.nombreMedico} </b> <br> <b> ${itemt.especialidad}</b> <hr class="my-2 opacity-10">`;

    let request;
    if (medicamento) {
      const idMedicamento = this.generalForm.get('medicamento')?.value?.idMedicamento;

      if (!idMedicamento) {
        Swal.close();
        Swal.fire(
          'Medicamento requerido',
          'Debe seleccionar un medicamento para generar esta consulta.',
          'warning'
        );
        return;
      }
      request = this.formulaService.getReporteTopMedicoMedicamentoIps(
        this.parametro,
        this.generalForm.get('fechainicial')?.value,
        this.generalForm.get('fechafinal')?.value,
        idMedicamento,
        itemt.idMedico,
        this.generalForm.get('eps')?.value

      );

    } else {

      request = this.formulaService.getReporteTopMedicoIps(
        this.parametro,
        this.generalForm.get('fechainicial')?.value,
        this.generalForm.get('fechafinal')?.value,
        itemt.idMedico,
        this.generalForm.get('eps')?.value
      );
    }
    request.subscribe(
      (resp: any) => {


        for (let i = 0; i < resp.length; i++) {

          const item = resp[i];

          mensaje += `
    <div>
      ${i + 1} - ${item.nombreBodega} - Nro. de Fórmulas: ${item.cantidadTotal} 
    </div>
  `;

        }

        Swal.close();

        Swal.fire({
          icon: 'success',
          title: 'Lista de IPS donde prescribe',
          html: mensaje,
          width: 700
        });

      },
      (error: any) => {
        Swal.close();
        Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
      }
    );
  }

  async reporteFormulasDetalldasEstadistica(): Promise<void> {
    const fInicial = this.generalForm.get('fechainicial')?.value;
    const fFinal = this.generalForm.get('fechafinal')?.value;
    // Validar que las fechas no sean nulas y que fInicial no sea mayor a fFinal
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

      // Mostrar spinner mientras carga
      Swal.fire({
        title: 'Cargando registros...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Esperar la promesa con await 
      
      const parametrobodega = Number(this.generalForm.get('idBodega')?.value);
      let resp: any;
            resp  = await this.formulaService.getFormulasDetalladasEstadistica(parametrobodega, fInicial, fFinal).toPromise();
      // Asegurarse de que resp sea un array antes de asignarlo
      Swal.close(); // 🚨 Primero cerramos el spinner
      if (Array.isArray(resp)) {
        this.lista = resp;
        this.exportarExcelFormulas("detalladas"); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }
    } catch (error) {
      console.error("Error al obtener los datos de medicamentos pendientes detallados:", error);
      Swal.close(); // 🚨 Primero cerramos el spinner
      Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
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
      'DISPENSARIO',
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
      'FUNCIONARIO QUE EDITA LA FÓRMULA',
      'FECHA EDICION DE LA FÓRMULA',
      'TIENE SOPORTE',
    ];

    datos.push(encabezado);
    // Agrega los items de despacho al array
    this.lista.forEach((item: any) => {      
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
        item.fecCreacion || '',
        item.funcionarioedita || '',
        item.fecEdicion || '',
        item.soporte || ''
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
    XLSX.writeFile(libroDeTrabajo, 'Formulas_' + fileName + new Date().getTime() + '.xlsx');
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


