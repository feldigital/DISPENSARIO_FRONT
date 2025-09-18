import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';



@Component({
  selector: 'app-historialpqrs',
  templateUrl: './historialpqrs.component.html',
  styleUrls: ['./historialpqrs.component.css']
})
export class HistorialpqrsComponent {


  parametro: any;
  @Input() datoRecibido: number = NaN;
  generalForm!: FormGroup;
  listaregistros: any;
  listaMedicamentoPqrs: any;
  listaPacientePqrs: any = [];
  lista: any = [];
  listaMedicamentoPqrsFiltro: any = [];
  listaPacientePqrsFiltro: any = [];


  constructor(
    private servicio: BodegaService,
    private activatedRoute: ActivatedRoute,
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
      listFilter: [''],
      paciente: [''],
      verpaciente: [''],
      pendiente: [''],
    });


  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam && !isNaN(Number(idParam))) {
        this.parametro = Number(idParam);
        this.buscarRegistro(this.parametro);
      } else {
        this.parametro = parseInt(sessionStorage.getItem('bodega') || '0', 10);
        if (this.parametro && !isNaN(this.parametro)) {
          this.buscarRegistro(this.parametro);
        }
      }

    });


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
          this.generalForm.patchValue({ idBodega: +this.parametro }, { emitEvent: false });
        }
      },
      (err: any) => {
        console.error(err);
      }
    );

    this.generalForm.get('listFilter')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
        switchMap(query => this.buscarMedicamentos(query))
      )
      .subscribe(results => {
        this.listaMedicamentoPqrsFiltro = results
      });

    this.generalForm.get('paciente')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
        switchMap(query => this.buscarPacientes(query))
      )
      .subscribe(results => {
        this.listaPacientePqrsFiltro = results
      });


    // Escuchar cambios en el select de bodegas
    this.generalForm.get('idBodega')!.valueChanges.subscribe((nuevoIdBodega: number) => {
      if (nuevoIdBodega) {
        this.parametro = nuevoIdBodega;
        this.buscarRegistro(nuevoIdBodega);
      }
    });

    this.generalForm.patchValue({ idBodega: this.datoRecibido });


  }




  async buscarRegistro(id: number): Promise<void> {

    // Limpiar listas antes de cargar nueva data
    this.lista = [];
    this.listaPacientePqrs = [];
    this.listaPacientePqrsFiltro = [];
    this.listaMedicamentoPqrs = [];
    this.listaMedicamentoPqrsFiltro = [];
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
      const resp: any = await this.servicio.getMedicamentosBodegaEntregaDetalladaConsolidadaPqrs(id, fInicial, fFinal).toPromise();
      Swal.close(); // 🚨 Primero cerramos el spinner
      // Asegurarse de que resp sea un array antes de asignarlo
      if (Array.isArray(resp)) {
        this.lista = resp;
        this.listaMedicamentoPqrsFiltro = resp;


        // 🔹 Agrupar pacientes únicos por fórmula con cantidad de repeticiones
        const pacientesMap = new Map<string, any>();

        resp.forEach((item: any) => {
          if (!pacientesMap.has(item.idFormula)) {
            pacientesMap.set(item.idFormula, {
              ...item,
              repeticiones: 1,
              tienePendientes: item.pendiente > 0, // primer estado
            });
          } else {
            const registro = pacientesMap.get(item.idFormula);
            registro.repeticiones++;

            // Si algún item tiene pendiente > 0, marcar la fórmula como pendiente
            if (item.pendiente > 0) {
              registro.tienePendientes = true;
            }
          }
        });

        // Convertir a arreglo
        this.listaPacientePqrs = Array.from(pacientesMap.values());
        this.listaPacientePqrsFiltro = this.listaPacientePqrs;


        //this.exportarExcel(); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }

    } catch (error) {
      console.error("Error al obtener los datos de las PQRS detallada:", error);
      Swal.close(); // 🚨 Primero cerramos el spinner
      Swal.fire('Error', 'No se pudieron cargar los registros de PQRS.', 'error');
    }
  }




  buscarMedicamentos(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.trim().length > 3) {
      const palabras = filterValue.toLowerCase().trim().split(/\s+/); // dividir por espacios
      const filteredResults = this.lista.filter((item: any) => {
        const nombre = item.nombreMedicamento.toLowerCase();
        const idFormula = String(item.idFormula || '').toLowerCase();

        // ✅ Verificar que todas las palabras estén en el nombre o en el idFormula
        return palabras.every(palabra =>
          nombre.includes(palabra) || idFormula.includes(palabra)
        );
      });
      return of(filteredResults);
    }
    // Si no hay filtro, devolver la lista completa
    return of(this.lista);
  }

  buscarPacientes(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.trim().length > 3) {
      const palabras = filterValue.toLowerCase().trim().split(/\s+/); // dividir por espacios
      const filteredResults = this.listaPacientePqrs.filter((item: any) => {
        const pnombre = (item.pNombre || '').toLowerCase();
        const snombre = (item.sNombre || '').toLowerCase();
        const papellido = (item.pApellido || '').toLowerCase();
        const sapellido = (item.sApellido || '').toLowerCase();
        const idFormula = String(item.idFormula || '').toLowerCase();

        // ✅ Verificar que todas las palabras estén en el nombre o en el idFormula
        return palabras.every(palabra =>
          pnombre.includes(palabra) || snombre.includes(palabra) || papellido.includes(palabra) || sapellido.includes(palabra) || idFormula.includes(palabra)
        );
      });
      return of(filteredResults);
    }
    // Si no hay filtro, devolver la lista completa
    return of(this.listaPacientePqrs);
  }




  async pqrsXLSDetalldos(): Promise<void> {
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
      //const parametrobodega = Number(idBodega);
      const resp: any = await this.servicio.getMedicamentosBodegaEntregaDetalladaConsolidadaPqrs(this.generalForm.get('idBodega')?.value, fInicial, fFinal).toPromise();
      Swal.close(); // 🚨 Primero cerramos el spinner
      // Asegurarse de que resp sea un array antes de asignarlo
      if (Array.isArray(resp)) {
        this.lista = resp;

        this.exportarExcelPQRS(); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }

    } catch (error) {
      console.error("Error al obtener los datos de PQRS detallados:", error);
      Swal.close(); // 🚨 Primero cerramos el spinner
      Swal.fire('Error', 'No se pudieron cargar los registros  PQRS detallados.', 'error');
    }
  }

  exportarExcelPQRS() {  // Crea un array con los datos de la orden de despacho que deseas exportar
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
      'ID MEDICAMENTO',
      'NOMBRE DEL MEDICAMENTO',
      'VIA DE ADMINISTRACION',
      'FORMA FARMACEUTICA',
      'CANTIDAD PRESCRITA',
      'CANTIDAD ENTREGADA',
      'CANTIDAD PENDIENTE',
      'FECHA DE SOLICITUD',
      'FECHA DE ENTREGA',
      'FUNCIONARIO QUE ENTREGA',
      'FECHA PQRS',
      'CANAL DEL PQRS',
      'ESTADO'
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
        item.idMedicamento || '',
        item.nombreMedicamento || '',
        item.via || '',
        item.forma || '',
        item.cantidadPrescrita || 0,
        item.cantidadEntrega || 0,
        item.pendiente || 0,
        item.fecSolicitud || '',
        item.fecEntrega || '',
        item.funcionario || '',  // Validación para campos que podrían ser nulos       
        item.fecEstimada || '',
        item.cieR3 || '',
        item.pendiente > 0 ? 'PENDIENTE' : 'RESUELTA'

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
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'PQRS');
    // Genera y descarga el archivo Excel
    XLSX.writeFile(libroDeTrabajo, 'PQRS_DETALLE_' + new Date().getTime() + '.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte fue exportado en su carpeta de descargas en formato xslx`,

    });
  }

  pqrsPendiente(event: any): void {
    if (event.target.checked) {
      this.listaMedicamentoPqrsFiltro = this.lista.filter((registro: any) => (registro.pendiente > 0));
    }
    else {
      this.listaMedicamentoPqrsFiltro = this.lista;
    }
  }

  pqrspacientePendiente(event: any): void {
    if (event.target.checked) {
      this.listaPacientePqrsFiltro = this.listaPacientePqrs.filter((registro: any) => (registro.tienePendientes));
    }
    else {
      this.listaPacientePqrsFiltro = this.listaPacientePqrs;
    }
  }

   public verDetallesPQRS(itemt: any) {
  // Filtrar todos los medicamentos de esa fórmula
  const medicamentosFormula = this.lista.filter(
    (registro: any) => registro.idFormula === itemt.idFormula
  );

   // Construir el mensaje
  let mensaje = itemt.tienePendientes ? 'Estado general ⏳ Pendiente <br><br>' : ' Estado general ✅ Resuelta <br><br>'; 
  medicamentosFormula.forEach((med: any, index: number) => {
    const estado = med.pendiente > 0 ? '⏳ Pendiente' : '✅ Entregado';
    mensaje += `${index + 1} - ${med.nombreMedicamento} - Cantidad prescrita/entrega: ${med.cantidadPrescrita} / ${med.cantidadEntrega} (${estado})<br>`;
  });

  Swal.fire({
    icon: 'info',
    title: `Medicamentos en PQRS fórmula Nro. <b>${itemt.idFormula}</b>`,
    html: mensaje,
    width: 600,
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

  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}
