import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { HistorialMensajeI } from 'src/app/modelos/historialMensaje';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { FormulaService } from 'src/app/servicios/formula.service';
import { WhatsappService } from 'src/app/servicios/whatsapp.service';
import Swal from 'sweetalert2';


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
    date30DaysAgo.setDate(currentDate.getDate() - 90);
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
