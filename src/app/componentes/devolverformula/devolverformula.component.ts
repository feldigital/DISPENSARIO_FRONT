import { Component, OnInit } from '@angular/core';
import { FormulaDevolucionI } from 'src/app/modelos/formuladevolucion.model';
import { PacienteService } from 'src/app/servicios/paciente.service';
import { ActivatedRoute } from '@angular/router';
import { map, debounceTime, switchMap} from 'rxjs/operators';
import { DevolverformulaService } from 'src/app/servicios/devolverformula.service';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MedicoService } from 'src/app/servicios/medico.service';
import { IpsService } from 'src/app/servicios/ips.service';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { MatDialog } from '@angular/material/dialog';
import { IpsComponent } from '../ips/ips.component';
import { MedicosComponent } from '../medicos/medicos.component';


export interface CausaDevolucion {
  id: string;
  label: string;
  selected?: boolean;
}
@Component({
  selector: 'app-devolverformula',
  templateUrl: './devolverformula.component.html',
  styleUrls: ['./devolverformula.component.css']
})

export class DevolverformulaComponent implements OnInit {

  formulaDevolucion: FormulaDevolucionI = new FormulaDevolucionI();
  facturaForm!: FormGroup;
  pacienteActual: any;
  bodegaActual: any;
  mostrarComponente: Boolean = false;
  hoy!: string;
  minimohoy!: string;
  fechaActual!: Date;
  editarContacto: boolean = false;


  observaciones: string = '';
  otraCausaTexto: string = '';

  // Banderas para mostrar mensajes de validación
  errorCausales: boolean = false;
  errorOtraCausa: boolean = false;

  causasList: CausaDevolucion[] = [
    { id: 'sin_firma', label: 'Fórmula sin firma médica o registro', selected: false },
    { id: 'error_concentracion', label: 'Error en la concentración de medicamentos', selected: false },
    { id: 'error_forma_farmaceutica', label: 'Error en la forma farmacéutica', selected: false },
    { id: 'error_cantidad_total', label: 'Error en la cantidad total de medicamento', selected: false },
    { id: 'error_dosificacion', label: 'Error en la dosificación', selected: false },
    { id: 'urgencia_mayor_un_mes', label: 'Fórmula de urgencia con más de un mes de tratamiento', selected: false },
    { id: 'error_cantidad_vs_dosis', label: 'Error en la cantidad solicitada VS dosificación', selected: false },
    { id: 'sin_relacion_diagnostico', label: 'Medicamento ordenado no se relaciona con el diagnóstico', selected: false },
    { id: 'sin_duracion_tratamiento', label: 'Fórmula sin duración de tratamiento', selected: false },
    { id: 'letra_no_legible', label: 'Letra no legible', selected: false },
    { id: 'error_prescriptor', label: 'Error en el profesional prescriptor', selected: false },
    { id: 'formula_vencida', label: 'Fórmula Vencida', selected: false },
    { id: 'error_autorizacion', label: 'Error en la autorización', selected: false },
    { id: 'tachones_enmendaduras', label: 'Tachones y enmendaduras', selected: false },
    { id: 'nombre_comercial', label: 'Fórmula prescrita con nombre comercial', selected: false },
    { id: 'otro', label: 'Otro', selected: false }
  ];

  medicosFiltrados: any[] = [];
  ipsFiltrados: any[] = [];

  constructor(private pacienteService: PacienteService,
    private formuladevolucionService: DevolverformulaService,
    private medicoService: MedicoService,
    private ipsService: IpsService,
    private bodegaService: BodegaService,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog) {
    this.facturaForm = this.formBuilder.group({
      id: [''],
      observacion: [''],
      ips: ['', Validators.required],
      medico: ['', Validators.required],
      fecPrescribe: ['', Validators.required],
      fecSolicitud: [new Date().toISOString().split('T')[0], Validators.required],
      paciente: ['', Validators.required],
      direccion: [''],
      celularPrincipal: [''],
      celularSecundario: [''],
      barrio: [''],
      email: [''],
    });
  }

  ngOnInit() {
    this.deshabilitarControles();
    this.activatedRoute.paramMap.subscribe(params => {
      let pacienteId = +params.get('id')!;
      let formulaId = +params.get('idFormula')!;

      if (pacienteId) {
        // Procesar el paciente

        this.pacienteService.getRegistroId(pacienteId).subscribe(cliente => {
          this.procesarPaciente(cliente);

        });

      } else if (formulaId) {
        // Procesar la formula formulaService
        this.formuladevolucionService.getDevolucionFormulaId(formulaId).subscribe(reg => {
          this.formulaDevolucion = reg;
          this.mostrarComponente = true;
          this.pacienteActual = reg.paciente;
          this.mostrarRegistro(reg);

        });


      }

    });


    this.facturaForm.get('medico')!.valueChanges
      .pipe(
        debounceTime(300),
        map(value => {
          if (typeof value === 'string') {
            return value.trim().toLowerCase();
          } else if (value && typeof value === 'object' && 'nombre' in value) {
            return value.nombre.toLowerCase(); // si ya seleccionó un medicamento
          } else {
            return '';
          }
        }),
        switchMap(query => this.medicoService.filtrarMedicos(query))
      )
      .subscribe(results => {
        this.medicosFiltrados = results;
      });


    this.facturaForm.get('ips')!.valueChanges
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
        switchMap(query => this.ipsService.filtrarIpss(query))
      )
      .subscribe(results => {
        this.ipsFiltrados = results;
      });




    let bodegaString = sessionStorage.getItem("bodega");
    let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
    this.bodegaService.getRegistroId(bodega)
      .subscribe((resp: any) => {
        this.bodegaActual = resp;
      },
        (err: any) => { console.error(err) }
      );
   
    this.fechaActual = new Date();
    const date30DaysAgo = new Date(this.fechaActual);
    date30DaysAgo.setDate(this.fechaActual.getDate() - 5);
    this.hoy = this.fechaActual.toISOString().split('T')[0];  // Formato YYYY-MM-DD
    this.minimohoy = date30DaysAgo.toISOString().split('T')[0];  // Formato YYYY-MM-DD
  }


  mostrarRegistro(itemt: any) {
    var fp = new Date(itemt.fecPrescribe);
    var fs = new Date(itemt.fecSolicitud);
    this.facturaForm.patchValue({
      idFormula: itemt.idFormula,
      nroFormula: itemt.nroFormula,
      observacion: itemt.observacion,
      ips: itemt.ips,
      medico: itemt.medico,
      fecPrescribe: fp.toJSON().slice(0, 10),
      fecSolicitud: fs.toJSON().slice(0, 10),
      paciente: itemt.paciente.numDocumento,

    })
  }


  openDialogIps(): void {
    const dialogRef = this.dialog.open(IpsComponent, {
      width: '400px',
      data: { /* puedes pasar datos iniciales aquí */ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí puedes manejar los datos devueltos, por ejemplo, seleccionar la IPS recién creada
        this.facturaForm.get('ips')!.setValue(result.nombre);
      }
    });
  }


  openDialogMedico(): void {
    const dialogRef = this.dialog.open(MedicosComponent, {
      width: '400px',
      data: { /* puedes pasar datos iniciales aquí */ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí puedes manejar los datos devueltos, por ejemplo, seleccionar la IPS recién creada
        this.facturaForm.get('medico')!.setValue(result.nombre);
      }
    });
  }



  onOptionSelectedIps(option: any) {
    this.facturaForm.get('ips')?.setValue(option);
  }


  onOptionSelectedMedico(option: any) {
    this.facturaForm.get('medico')?.setValue(option);
  }

  displayIps(ips?: any): string {
    return ips ? ips.nombre : '';
  }

  // Función para mostrar el nombre del médico en el autocompletar
  displayMedico(medico?: any): string {
    return medico ? medico.nombre : '';
  }

  autocompletadoValido(options: any[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const valorIngresado = control.value;
      const valido = options.some(option => option.nombre === valorIngresado);
      return !valido ? { 'opcionInvalida': { value: control.value } } : null;
    };
  }

  public buscarDocumento() {
    this.deshabilitarControles(); // Deshabilitamos inicialmente
    const documentoInput = this.facturaForm.get('paciente')!.value;

    this.pacienteService.getRegistroDocumento(documentoInput).subscribe({
      next: (cliente) => {
        // 1. ESCENARIO: El documento no existe en la base de datos (arreglo vacío o nulo)
        if (!cliente || cliente.length === 0) {
          this.pacienteActual = null;
          this.mostrarComponente = false
          Swal.fire({
            icon: 'warning',
            title: 'PACIENTE NO ENCONTRADO',
            text: 'El paciente no se encuentra registrado en la base de datos, Verificar la comprobacion de derecho.',
            confirmButtonColor: '#1e3a8a' // Azul profesional acorde a tu tabla
          });

          return;
        }

        // 2. ESCENARIO: Documento duplicado
        if (cliente.length > 1) {
          Swal.fire({
            icon: 'error',
            title: 'DOCUMENTO DUPLICADO',
            text: 'Este documento está duplicado en la base de datos. Identifique claramente al paciente para entregar el medicamento.',
          });
          return;
        }

        // 3. ESCENARIO: Encontrado exitosamente (longitud === 1)
        if (cliente.length === 1) {
          this.procesarPaciente(cliente[0]);
        }
      },
      error: (err) => {
        console.error('Error al buscar documento:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Conexión',
          text: 'No se pudo consultar la base de datos en este momento.',
        });
      }
    });
  }

  private procesarPaciente(cliente: any): void {
    this.formulaDevolucion.paciente = cliente;
    this.pacienteActual = cliente;
    this.mostrarComponente = true;

    // 👉 Rellenar el formulario con los datos del paciente
    this.facturaForm.patchValue({
      direccion: this.pacienteActual.direccion,
      celularPrincipal: this.pacienteActual.celularPrincipal,
      celularSecundario: this.pacienteActual.celularSecundario,
      barrio: this.pacienteActual.barrio,
      email: this.pacienteActual.email
    });



    if (this.pacienteActual.estado === true) {
      if (this.pacienteActual.dispensario === "SISM DISPENSARIO") {

        const municipioPaciente = this.pacienteActual.municipio.codigo;
        const municipioPortabilidad = this.pacienteActual.mpoportabilidad?.codigo;
        const fechaVencimientoPortabilidad = new Date(this.pacienteActual?.fecVencePortabilidad);
        const fechaActual = new Date(this.fechaActual);

        if (this.bodegaActual.municipio === municipioPaciente ||
          (this.pacienteActual.portabilidad &&
            this.bodegaActual.municipio === municipioPortabilidad &&
            fechaVencimientoPortabilidad >= fechaActual)) {
          this.habilitarControles();

          this.facturaForm.updateValueAndValidity();
        } else {
          Swal.fire({
            icon: 'warning',
            title: `OTRO MUNICIPIO`,
            text: `El paciente está en otro municipio o portabilidad vencida.`,
          });
        }

      } else {
        Swal.fire({
          icon: 'warning',
          title: `OTRO DISPENSARIO`,
          text: `El paciente pertenece a otro dispensario.`,
        });
      }

    } else {
      Swal.fire({
        icon: 'info',
        title: `INACTIVO`,
        text: `El paciente está inactivo. No se puede generar la entrega de medicamentos.`,
      });
    }
  }


  habilitarControles(): void {
    this.facturaForm.get('observacion')?.enable();
    this.facturaForm.get('ips')?.enable();
    this.facturaForm.get('medico')?.enable();
    this.facturaForm.get('fecPrescribe')?.enable();
    this.facturaForm.get('fecSolicitud')?.enable();
  }

  deshabilitarControles(): void {
    this.facturaForm.get('observacion')?.disable();
    this.facturaForm.get('ips')?.disable();
    this.facturaForm.get('medico')?.disable();
    this.facturaForm.get('fecPrescribe')?.disable();
    this.facturaForm.get('fecSolicitud')?.disable();
  }







create(): void {
  if (!this.facturaForm.valid) {
    Swal.fire({
      icon: 'warning',
      title: '¡Alerta!',
      text: '¡Datos incompletos para crear la fórmula en la base de datos!'
    });
    return;
  }

  // 1. Validar rango de fechas de prescripción
  const fechaPrescribe = new Date(this.facturaForm.get('fecPrescribe')?.value);
  const fechaHoy = new Date();
  
  // Normalizamos a 00:00:00 para comparar solo fechas sin importar la hora
  fechaPrescribe.setHours(0, 0, 0, 0);
  fechaHoy.setHours(0, 0, 0, 0);

  const fechaLimite = new Date(fechaHoy);
  fechaLimite.setDate(fechaLimite.getDate() - 30); // 30 días atrás

  // Si la fecha es futura o es más antigua que 30 días
  if (fechaPrescribe > fechaHoy || fechaPrescribe < fechaLimite) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La fecha digitada en la prescripción de la fórmula está fuera del rango permitido (máximo 30 días). Corregirla y continuar.'
    });
    return;
  }

  // 2. Validar que la bodega permita dispensación
  if (!this.bodegaActual?.dispensa) {
    Swal.fire({
      icon: 'warning',
      title: '¡Alerta!',
      text: `La bodega ${this.bodegaActual?.nombre || ''} donde está logueado el usuario no está habilitada para dispensar fórmulas a pacientes.`
    });
    return;
  }

  // 3. Confirmación y ejecución
  Swal.fire({
    title: '¿Confirma agregar la devolución de la fórmula?',
    text: 'Se guardará la devolución de la fórmula en el sistema.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: '¡Sí, confirmar!',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      this.agregarFormula(1);
    }
  });
}

public agregarFormula(cuantas: number): void {
  const bodegaString = sessionStorage.getItem("bodega");
  const funcionario = sessionStorage.getItem("nombre") || "";
  const bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);

  // Mapeo de datos al objeto
  this.formulaDevolucion.idBodega = bodega;
  this.formulaDevolucion.ips = this.facturaForm.get('ips')?.value;
  this.formulaDevolucion.medico = this.facturaForm.get('medico')?.value;
  this.formulaDevolucion.fecPrescribe = this.facturaForm.get('fecPrescribe')?.value;
  this.formulaDevolucion.observacion = this.facturaForm.get('observacion')?.value;
  this.formulaDevolucion.funcionariocreaformula = funcionario;

  // Asignación de causales y otra causa (Asegúrate de tener estos controles en el ReactiveForm)
  this.formulaDevolucion.causasDevolucion = this.facturaForm.get('causasDevolucion')?.value || [];
  this.formulaDevolucion.otraCausa = this.facturaForm.get('otraCausa')?.value || '';

  // Manejo de fecha de solicitud
  const fechaSolicitud = this.facturaForm.get('fecSolicitud')?.value;
  const ahoraStr = new Date().toISOString().split('T')[0];

  if (fechaSolicitud === ahoraStr) {
    this.formulaDevolucion.fecSolicitud = new Date();
  } else {
    this.formulaDevolucion.fecSolicitud = fechaSolicitud;
  }

  // Mapeo de datos del paciente
  this.formulaDevolucion.codEps = this.pacienteActual.eps.codigo;
  this.formulaDevolucion.regimen = this.pacienteActual.regimen;
  this.formulaDevolucion.categoria = this.pacienteActual.categoria.codigo;

  // Petición al Backend
  this.formuladevolucionService.createDevolucion(this.formulaDevolucion).subscribe({
    next: (resp) => {
      Swal.fire({
        icon: 'success',
        title: '¡Registrado!',
        text: '¡La devolución ha sido agregada correctamente!'
      });

      // Limpiar formulario y resetear causales
      this.formulaDevolucion.causasDevolucion = [];
      this.facturaForm.reset();
      this.facturaForm.get('paciente')?.setValue(this.pacienteActual.numDocumento);
    },
    error: (err) => {
      Swal.fire({
        icon: 'error',
        title: 'Error...',
        text: '¡No se pudo guardar la devolución de la fórmula en la base de datos!',
        footer: err?.error?.mensaje || err?.mensaje || 'Error de conexión con el servidor'
      });
    }
  });
}

 


  calcularEdad(fn: Date): string {
    if (fn !== null && fn !== undefined) {
      const convertAge = new Date(fn);
      const timeDiff = Math.abs(Date.now() - convertAge.getTime());
      let edad = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);
      if (edad) {
        return edad.toString();
      }
    }
    return '-';

  }

  

  cancelarEdicion() {
    this.editarContacto = false;
  }

  enEdicion() {
    this.editarContacto = true;
  }

  validarCelular(celular: string): boolean {
    const regex = /^[3][0-9]{9}$/; // Ej. para Colombia: empieza por 3, 10 dígitos
    return regex.test(celular);
  }

  validarEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  guardarDatosContacto() {
    // Obtener y limpiar los valores del formulario
    this.pacienteActual.celularPrincipal = String(this.facturaForm.get('celularPrincipal')!.value || '').trim();
    this.pacienteActual.celularSecundario = String(this.facturaForm.get('celularSecundario')!.value || '').trim();
    this.pacienteActual.direccion = String(this.facturaForm.get('direccion')!.value || '').trim();
    this.pacienteActual.barrio = String(this.facturaForm.get('barrio')!.value || '').trim();
    this.pacienteActual.email = String(this.facturaForm.get('email')!.value || '').trim().toLowerCase();


    // Validar celular solo si se ingresó
    if (this.pacienteActual.celularPrincipal && !this.validarCelular(this.pacienteActual.celularPrincipal)) {
      Swal.fire('Celular inválido', 'Si ingresa un celular principal, debe tener un formato válido.', 'warning');
      return;
    }

    // Validar email solo si se ingresó
    if (this.pacienteActual.email && !this.validarEmail(this.pacienteActual.email)) {
      Swal.fire('Correo inválido', 'Si ingresa un correo electrónico, debe tener un formato válido.', 'warning');
      return;
    }


    Swal.fire({
      title: '¿Desea actualizar?',
      html: `
      <p style="margin:2px 0;"><strong>Teléfono Principal:</strong> ${this.pacienteActual.celularPrincipal}</p>
      <p style="margin:2px 0;"><strong>Teléfono Secundario:</strong> ${this.pacienteActual.celularSecundario}</p>
      <p style="margin:2px 0;"><strong>Dirección:</strong> ${this.pacienteActual.direccion}</p>
      <p style="margin:2px 0;"><strong>Barrio:</strong> ${this.pacienteActual.barrio}</p>
      <p style="margin:2px 0;"><strong>Correo:</strong> ${this.pacienteActual.email}</p>   
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Actualizar!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Llama al servicio para guardar los datos

        this.pacienteService.update(this.pacienteActual).subscribe({
          next: (resp: any) => {

            Swal.fire({
              icon: 'success',
              title: `Actualización exitosa`,
              text: `Los datos de contacto del paciente ${this.pacienteActual.pNombre} ${this.pacienteActual.sNombre} ${this.pacienteActual.pApellido} ${this.pacienteActual.sApellido} fueron actualizados correctamente.`,
            });
          },
          error: (error) => {
            console.error('❌ Error actualizando el registro', error);
            Swal.fire('Error', 'No se pudo actualizar el registro.', 'error');
          }
        });

      }
    });
    this.editarContacto = false;
  }


  toggleCausa(causa: CausaDevolucion): void {
    causa.selected = !causa.selected;
    this.onCausaChange(causa);
  }

  onCausaChange(causa: CausaDevolucion): void {
    this.errorCausales = false;

    // Si desmarcan 'Otro', limpiamos el texto y el error
    if (causa.id === 'otro' && !causa.selected) {
      this.otraCausaTexto = '';
      this.errorOtraCausa = false;
    }
  }

  onInputOtroChange(): void {
    if (this.otraCausaTexto.trim() !== '') {
      this.errorOtraCausa = false;
    }
  }

  isOtroSelected(): boolean {
    const otroObj = this.causasList.find(c => c.id === 'otro');
    return !!otroObj?.selected;
  }

  validarFormulario(): boolean {
    let esValido = true;

    // 1. Validar que exista al menos una causal seleccionada
    const tieneCausal = this.causasList.some(c => c.selected);
    if (!tieneCausal) {
      this.errorCausales = true;
      esValido = false;
    } else {
      this.errorCausales = false;
    }

    // 2. Validar que si 'Otro' está seleccionado, la justificación no esté vacía
    if (this.isOtroSelected() && (!this.otraCausaTexto || this.otraCausaTexto.trim() === '')) {
      this.errorOtraCausa = true;
      esValido = false;
    } else {
      this.errorOtraCausa = false;
    }

    return esValido;
  }

  guardarDevolucion(): void {
    if (!this.validarFormulario()) {
      return;
    }

    const seleccionadas = this.causasList
      .filter(c => c.selected)
      .map(c => c.label);

    const payload = {
      causales: seleccionadas,
      otraCausaDetalle: this.isOtroSelected() ? this.otraCausaTexto.trim() : null,
      observaciones: this.observaciones.trim()
    };

    console.log('Formulario válido. Objeto a enviar:', payload);
    // Invocación a tu servicio HTTP / Backend
  }

  cancelar(): void {
    // Lógica para cerrar el modal o redirigir
  }

}
