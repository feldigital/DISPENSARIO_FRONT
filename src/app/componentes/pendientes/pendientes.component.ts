import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { HistorialMensajeI } from 'src/app/modelos/historialMensaje';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { FormulaService } from 'src/app/servicios/formula.service';
import { WhatsappService } from 'src/app/servicios/whatsapp.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-pendientes',
  templateUrl: './pendientes.component.html',
  styleUrls: ['./pendientes.component.css']
})
export class PendientesComponent {
  listaPendienteBodega: any = [];
  listaPendienteBodegaFiltro: any = [];
  parametro: any;
  @Input() datoRecibido: number = NaN;
  generalForm!: FormGroup;
  listaregistros: any;
  listaPaciente: any = [];
  enviandoMensajes: boolean = false;
  mayorExistencia: String = "";
  historialEnvio: HistorialMensajeI = new HistorialMensajeI();
  celular:string="";
  funcionario:string | null ="";
  lista: any = [];
  

  constructor(
    private servicio: BodegaService,
    private activatedRoute: ActivatedRoute,  
    private servicioformula: FormulaService,
    private whatsappService: WhatsappService,
    private fb: FormBuilder) {
    // Calcula la fecha actual
    const currentDate = new Date();
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 120);
    //  this.spinner.show();
    // Inicializa el formulario y define los FormControl para fechainicial y fechafinal
    this.generalForm = this.fb.group({
      idBodega: [''],
      fechainicial: [date30DaysAgo.toISOString().split('T')[0]],
      fechafinal: [currentDate.toISOString().split('T')[0]],
      listFilter: [''],
      existenciaPendiente: [''],
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
        this.listaPendienteBodegaFiltro = results
      });

    // Escuchar cambios en el select de bodegas
    this.generalForm.get('idBodega')!.valueChanges.subscribe((nuevoIdBodega: number) => {
      if (nuevoIdBodega) {
        this.parametro = nuevoIdBodega;
        this.buscarRegistro(nuevoIdBodega);
      }
    });

    this.generalForm.patchValue({ idBodega: this.datoRecibido });
    this.funcionario= sessionStorage.getItem("nombre");

  }




  public async buscarRegistro(id: number) {   
    // Limpiar listas antes de cargar nueva data
    this.listaPendienteBodega = [];
    this.listaPendienteBodegaFiltro = [];

     Swal.fire({
          title: 'Cargando registros...',
          html: 'Por favor espera un momento',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

    this.servicio.getMedicamentosBodegaPendiente(id, this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value)
      .subscribe((resp: any) => {       
        this.listaPendienteBodega = resp.map((item: any) => ({
          ...item,
          estado: false, // O cualquier lógica que determine el estado
          editing: false,
        }));             
        this.listaPendienteBodega.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));        
        this.listaPendienteBodegaFiltro = this.listaPendienteBodega
      Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
          },
          (error) => {
            console.error('❌ Error cargando registros', error);
            Swal.close(); // 🚨 Primero cerramos el spinner
            Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
          }
        );
  }


buscarMedicamentos(filterValue: string): Observable<any[]> {
  if (filterValue && filterValue.trim().length > 3) {
    const palabras = filterValue.toLowerCase().trim().split(/\s+/); // dividir por espacios
    const filteredResults = this.listaPendienteBodega.filter((item: any) => {
      const nombre = item.nombre.toLowerCase();
      // Verificar que todas las palabras estén en el nombre
      return palabras.every(palabra => nombre.includes(palabra));
    });
    return of(filteredResults);
  }
  // Si no hay filtro, devolver la lista completa
  return of(this.listaPendienteBodega);
}

 
  public buscarPacientePendiente(idBodega: number, idMedicamento: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.servicio.getPacientePendiente(
        idBodega,
        this.generalForm.get('fechainicial')?.value,
        this.generalForm.get('fechafinal')?.value,
        idMedicamento
      ).subscribe(
        (resp: any) => {
          this.listaPaciente = resp;         
          resolve();
        },
        (error) => {
          console.error('❌ Error buscando pacientes:', error);
          Swal.fire('Error', 'No se pudieron cargar los pacientes.', 'error');
          reject(error);
        }
      );
    });
  }
  


  public async mensajesWSPave(idBodega: number, idMedicamento: number) {
    // Primero buscar los pacientes
    await this.buscarPacientePendiente(idBodega, idMedicamento);  
    // Luego filtrar solo los pacientes PAVE
    this.listaPaciente = this.listaPaciente.filter((p: { pave: string; }) => p.pave === 'SI');
    if (this.listaPaciente.length === 0) {
      await Swal.fire('Sin pacientes PAVE', 'No se encontraron pacientes PAVE con pendientes de este medicamento!.', 'info');
      return;
    }    
    // Y enviar mensajes
    this.enviarMensajesConRetraso();
  }
  
  public async mensajesWSTodo(idBodega: number, idMedicamento: number) {
    // Primero buscar todos los pacientes
    await this.buscarPacientePendiente(idBodega, idMedicamento);  
    if (this.listaPaciente.length === 0) {
      await Swal.fire('Sin pacientes', 'No se encontraron pacientes con pendientes, para enviar el mensaje!', 'warning');
      return;
    }  
    // Y enviar mensajes a todos
    this.enviarMensajesConRetraso();
  }
  

private delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async enviarMensajesConRetraso() {
  const confirmacion = await Swal.fire({
    title: '¿Confirmar envío masivo?',
    html: `Se enviarán mensajes de WhatsApp a <strong>${this.listaPaciente.length}</strong> pacientes.<br><br>¿Deseas continuar?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, enviar',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacion.isConfirmed) {
    return; // salir si cancela
  }

  this.enviandoMensajes = true;
  let enviadosOk = 0;

  for (const paciente of this.listaPaciente) {
    // Construir mensaje
    const textomensaje = `Hola *${paciente.pNombre}*! \n${paciente.bodega} te informa que el pendiente Nro. *${paciente.idFormula}* de tu medicamento. \n💊${paciente.nombreMedicamento} \nYa se encuentra disponible para que lo puedas recoger, en tu punto de entrega. \nRecuerde que debe traer su volante de pendiente. \n\n*POR FAVOR NO RESPONDER ESTE MENSAJE*`;
    this.celular = paciente?.telefono.replace(/\s/g, '');
    const telefono = "57" + this.celular;

    if (!this.celularValido(this.celular)) {
      console.warn(`⚠️ Teléfono inválido: ${paciente.telefono}`);
      continue;
    }
    try {
      // Enviar mensaje y esperar respuesta
      const respuesta: any = await this.whatsappService.enviarMensaje({
        phone: telefono,
        message: textomensaje
      }).toPromise();
      // Validar respuesta
      if (respuesta?.responseExSave.key.id) {
        // Registrar historial
        this.historialEnvio.itemFormula_id = paciente.idItemFormula;
        this.historialEnvio.celularEnvio = this.celular;
        this.historialEnvio.funcionarioEnvio = this.funcionario!;
        this.historialEnvio.fechaEnvio = new Date();
        await this.servicioformula.guardarMensaje(this.historialEnvio).toPromise();
        enviadosOk++;       
      } else {
        console.warn(`⚠️ Falló el envío a ${telefono}:`, respuesta);
      }
    } catch (error) {
      console.error(`❌ Error enviando a ${telefono}`, error);
    }

    // Retraso antes de enviar el siguiente
    await this.delay(3000); // 3 segundos
  }

  this.enviandoMensajes = false;

  await Swal.fire(
    '✔️ Mensajes procesados',
    `Se enviaron correctamente <strong>${enviadosOk}</strong> de <strong>${this.listaPaciente.length}</strong> mensajes.<br>Los demás presentaron inconvenientes en el número o en el envío.`,
    'success'
  );
}

    
    celularValido(celular: string): boolean {
      // Validar que tenga exactamente 10 dígitos, empiece por "3" y solo números
      return /^[3][0-9]{9}$/.test(celular);
    }
  
    
  onMayorExistencia(event: any): void {
    if (event.target.checked) {
      this.listaPendienteBodegaFiltro = this.listaPendienteBodega.filter((registro: any) => (registro.cantidad > registro.pendiente ));
      this.mayorExistencia=this.listaPendienteBodegaFiltro.length.toString();
    }
    else {
      this.listaPendienteBodegaFiltro = this.listaPendienteBodega
      this.mayorExistencia="";
    }
  }



  async reportePendientesDetalldos(idBodega: number): Promise<void> {
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
      const parametrobodega = Number(idBodega);
      const resp: any = await this.servicio.getMedicamentosPendienteDetallada(parametrobodega, fInicial, fFinal).toPromise();
      Swal.close(); // 🚨 Primero cerramos el spinner
      // Asegurarse de que resp sea un array antes de asignarlo
      if (Array.isArray(resp)) {
        this.lista = resp;
         
        this.exportarExcelPendientes(); // Exportar solo si la lista es válida
      } else {
        console.error("El formato de la respuesta no es válido. Se esperaba un array.");
      }
      
    } catch (error) {
      console.error("Error al obtener los datos de medicamentos pendientes detallados:", error);
      Swal.close(); // 🚨 Primero cerramos el spinner
      Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
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
      'PACIENTE PAVE',
      'ID MEDICAMENTO'
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
        item.pave || '',  // Validación para campos que podrían ser nulos    
        item.idMedicamento || ''   
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
    XLSX.writeFile(libroDeTrabajo, 'Medicamentos_Pendientes_' + new Date().getTime() + '.xlsx');
    Swal.fire({
      icon: 'success',
      title: `Ok`,
      text: `Su reporte fue exportado en su carpeta de descargas en formato xslx`,

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
