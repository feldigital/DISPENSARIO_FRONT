
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, map, of, switchMap } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';
import { FormulaService } from 'src/app/servicios/formula.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-medicamentosentregados',
  templateUrl: './medicamentosentregados.component.html',
  styleUrls: ['./medicamentosentregados.component.css']
})
export class MedicamentosentregadosComponent {

  listaentregas: any = [];
  parametro: any;
  generalForm!: FormGroup;
  listaregistros: any;
  medicamentosFiltrados: any[] = [];
  medicamentoActual: any = NaN;
  totalCantidadEntregada: number = 0;


  constructor(
    private servicio: BodegaService,
    private formulaService: FormulaService,

    private fb: FormBuilder) {
    // Calcula la fecha actual
    const currentDate = new Date();
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 90);
    //  this.spinner.show();
    // Inicializa el formulario y define los FormControl para fechainicial y fechafinal
    this.generalForm = this.fb.group({
      idBodega: [''],
      fechainicial: [date30DaysAgo.toISOString().split('T')[0]],
      fechafinal: [currentDate.toISOString().split('T')[0]],
      medicamento: [''],
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
        if (this.medicamentoActual) {
          this.buscarRegistro(this.medicamentoActual, this.parametro);
        }
      }
    });

    this.generalForm.patchValue({ idBodega: this.parametro });


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

  }

  seleccionarMedicamento(event: MatAutocompleteSelectedEvent): void {
    this.medicamentoActual = event.option.value.idMedicamento;
    this.generalForm.get('medicamento')?.setValue(event.option.value.nombre);
    this.buscarRegistro(this.medicamentoActual, this.parametro);
  }

  public buscarRegistro(idMedicamento: number, idBodega: number) {
    if (idMedicamento) {
      // Limpiar listas antes de cargar nueva data
      this.listaentregas = [];
      this.totalCantidadEntregada = 0;
      // Mostrar spinner mientras carga
      Swal.fire({
        title: 'Cargando registros...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.formulaService.getMedicamentoentregadoPaciente(idMedicamento, idBodega, this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value)
        .subscribe((resp: any) => {
          this.listaentregas = resp;
          console.log(this.listaentregas);
          Swal.close(); // ✅ Cerrar el spinner al terminar correctamente          
          const totalEntregado = this.listaentregas.reduce((sum: number, item: any) => {
            return sum + (item.cantidadEntrega || 0); // usa 0 si el valor es null/undefined
          }, 0);

          this.totalCantidadEntregada = totalEntregado;
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
      const resp: any = await this.formulaService.getMedicamentoentregadoPaciente(this.medicamentoActual, parametrobodega, this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value).toPromise();

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

    const idBodega = this.generalForm.get('idBodega')?.value;
    const bodegaSeleccionada = this.listaregistros.find(
      (b: any) => b.idBodega === idBodega
    );
    const dispensario = bodegaSeleccionada ? bodegaSeleccionada.nombre : 'TODAS LAS BODEGAS';

    const medicamento = this.generalForm.get('medicamento')?.value;
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
      'CANTIDAD ENTREGADA'
    ];

    datos.push(encabezado);

    // Agrega los items de despacho al array
    this.listaentregas.forEach((item: any) => {

      datos.push([
        dispensario,
        item.tipoDoc || '',  // Validación si es null o undefined
        item.numDocumento || '',
        item.pApellido || '',
        item.sApellido || '',
        item.pNombre || '',
        item.sNombre || '',
        item.pave || '',  // Validación para campos que podrían ser nulos 
        item.eps || '',
        this.medicamentoActual || '',
        medicamento || '',  // nombre de la farmacia
        item.idFormula || '',
        this.formatFechaCorta(item.fecSolicitud) || '',
        this.formatFechaCorta(item.fecEntrega) || '',
        item.cantidadEntrega || 0
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
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'Paciente');
    // Genera y descarga el archivo Excel
    XLSX.writeFile(libroDeTrabajo, 'Entregados_' + new Date().getTime() + '.xlsx');
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




  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}

