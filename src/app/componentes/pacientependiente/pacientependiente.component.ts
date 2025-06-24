import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MensajeI } from 'src/app/modelos/mensaje.model';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { PacienteService } from 'src/app/servicios/paciente.service';
import { WhatsappService } from 'src/app/servicios/whatsapp.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientependiente',
  templateUrl: './pacientependiente.component.html',
  styleUrls: ['./pacientependiente.component.css']
})
export class PacientependienteComponent {
  listaPaciente: any = [];
  parametro: any;
  generalForm!: FormGroup;
  idBodega: number = NaN;
  idMedicamento: number = NaN;
  mensajeWhat: MensajeI = new MensajeI();
  enviandoMensajes: boolean = false;
  listaPacientePave: any = [];
  totalCantidadPendiente: number = 0;
  editarContacto: boolean = false;
  pacienteActual: any;

  constructor(
    private servicio: BodegaService,
    private activatedRoute: ActivatedRoute,
    private whatsappService: WhatsappService,
    private pacienteService: PacienteService,
    private fb: FormBuilder
  ) {
    const currentDate = new Date();
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 90);


    this.generalForm = this.fb.group({
      idBodega: [''],
      fechainicial: [date30DaysAgo.toISOString().split('T')[0]],
      fechafinal: [currentDate.toISOString().split('T')[0]],
      listFilter: [''],
      direccion: [''],
      celularPrincipal: [''],
      celularSecundario: [''],
      barrio: [''],
      email: [''],
    });
  }



  ngOnInit(): void {

    this.idBodega = Number(this.activatedRoute.snapshot.paramMap.get('idBodega'));
    this.idMedicamento = Number(this.activatedRoute.snapshot.paramMap.get('idMedicamento'));
    const fechaInicial = this.activatedRoute.snapshot.paramMap.get('fInicial');
    const fechaFinal = this.activatedRoute.snapshot.paramMap.get('fFinal');



    if (!isNaN(this.idBodega) && !isNaN(this.idMedicamento) && fechaInicial && fechaFinal) {
      this.buscarRegistro(this.idBodega, fechaInicial, fechaFinal, this.idMedicamento);
    }

  }

  public buscarRegistro(idBodega: number, fechaInicial: string, fechaFinal: string, idMedicamento: number) {

    this.totalCantidadPendiente = 0;

    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.servicio.getPacientePendiente(idBodega, fechaInicial, fechaFinal, idMedicamento)
      .subscribe((resp: any) => {
        this.listaPaciente = resp.map((item: any) => ({
          ...item,
          editing: false,
        }));
        this.listaPaciente.sort((a: any, b: any) => new Date(b.fecSolicitud).getTime() - new Date(a.fecSolicitud).getTime());
        Swal.close(); // ✅ Cerrar el spinner al terminar correctamente

        const totalPendiente = this.listaPaciente.reduce((sum: number, item: any) => {
          return sum + (item.pendiente || 0); // usa 0 si el valor es null/undefined
        }, 0);

        this.totalCantidadPendiente = totalPendiente;
      },
        (error) => {
          console.error('❌ Error cargando registros', error);
          Swal.close(); // 🚨 Primero cerramos el spinner
          Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
        }
      );
  }

  public buscarPendiente() {
    Swal.fire({
      title: 'Cargando registros...',
      html: 'Por favor espera un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.servicio.getPacientePendiente(this.idBodega, this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value, this.idMedicamento)
      .subscribe((resp: any) => {
        this.listaPaciente = resp;
        this.listaPacientePave = resp;
        this.listaPaciente.sort((a: any, b: any) => new Date(b.fecSolicitud).getTime() - new Date(a.fecSolicitud).getTime());
        Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
      },
        (error) => {
          console.error('❌ Error cargando registros', error);
          Swal.close(); // 🚨 Primero cerramos el spinner
          Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
        }
      );
  }


  enviarWhatsApp(paciente: any) {
    const textomensaje = "Hola *" + paciente.pNombre + "*! \n" + paciente.bodega + " te informa que el pendiente Nro. *" + paciente.idFormula + "* de tu medicamento. \n💊" + paciente.nombreMedicamento + " \nYa se encuentra disponible para que lo puedas recoger, en tu punto de entrega. \nRecuerde que debe traer su volante de pendiente. \n\n*POR FAVOR NO RESPONDER ESTE MENSAJE*";
    Swal.fire({
      title: '¿Enviar mensaje?',
      html: `
      <p><strong>Número:</strong> ${paciente?.telefono}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${textomensaje}</p>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, enviar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mensajeWhat.phone = "57" + paciente?.telefono.replace(/\s/g, '');
        this.mensajeWhat.message = textomensaje;
        if (this.celularValido(paciente?.telefono.replace(/\s/g, ''))) {
          this.whatsappService.enviarMensaje(this.mensajeWhat).subscribe(
            (resp: any) => {
              Swal.fire('📤 Mensaje enviado', '', 'success');
            },
            (err: any) => {
              Swal.fire('❌ Error al enviar el mensaje', err.message || 'Error desconocido', 'error');
              console.error(err);
            });
        }
        else { Swal.fire('Error', '❌ El número del paciente ' + paciente?.telefono + ',  no es válido para enviar el mensaje!', 'error'); }
      }
    });

  }


  async vermensajeWhatsApp(paciente: any) {

    const textomensaje = "Hola *" + paciente.pNombre + "*! \n" + paciente.bodega + " te informa que el pendiente Nro. *" + paciente.idFormula + "* de tu medicamento. \n💊" + paciente.nombreMedicamento + " \nYa se encuentra disponible para que lo puedas recoger, en tu punto de entrega. \nRecuerde que debe traer su volante de pendiente. \n\n*POR FAVOR NO RESPONDER ESTE MENSAJE*";
    const { value: formValues } = await Swal.fire({
      title: 'Editar y enviar WhatsApp',
      html: `
                  <label style="display:block; text-align:left;">Mensaje:</label>
                  <textarea id="mensaje" placeholder="Mensaje a enviar"
                  style="width: 100%; height: 180px; padding: 10px; resize: vertical; font-size: 14px;">${textomensaje}</textarea>
                  <label style="display:block; margin-top:10px; text-align:left;">Número celular:</label>
                  <input id="telefono" class="swal2-input" placeholder="Número celular" value="${paciente?.telefono || ''}">
                `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const mensaje = (document.getElementById('mensaje') as HTMLTextAreaElement).value;
        const telefono = (document.getElementById('telefono') as HTMLInputElement).value;
        if (!mensaje || !telefono) {
          Swal.showValidationMessage('Ninguno de los campos debe ser vacio');
          return null;
        }
        return { mensaje, telefono };
      }
    });

    if (formValues) {
      const confirmacion = await Swal.fire({
        title: '¿Enviar mensaje?',
        html: `
                    <p><strong>Número:</strong> ${formValues.telefono}</p>
                    <p><strong>Mensaje:</strong></p>
                    <p>${formValues.mensaje}</p>
                  `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'No, cancelar'
      });

      if (confirmacion.isConfirmed) {
        const textomensaje = formValues.mensaje;
        this.mensajeWhat.phone = "57" + formValues.telefono;
        this.mensajeWhat.message = textomensaje;
        if (this.celularValido(formValues.telefono)) {
          this.whatsappService.enviarMensaje(this.mensajeWhat).subscribe(
            (resp: any) => {
              Swal.fire('📤 Mensaje enviado', '', 'success');
            },
            (err: any) => {
              Swal.fire('❌ Error al enviar el mensaje', err.message || 'Error desconocido', 'error');
              console.error(err);
            }
          );
        }
        else {
          Swal.fire('Celular invalido', 'El numero de celular ' + formValues.telefono + ' no es valido para realizar el envio del mensaje.', 'error');
        }
      } else {
        Swal.fire('❌ Envío cancelado', '', 'info');
      }
    }
  }

  celularValido(celular: string): boolean {
    // Validar que tenga exactamente 10 dígitos, empiece por "3" y solo números
    return /^[3][0-9]{9}$/.test(celular);
  }

  public async mensajesWSPave() {
    this.listaPacientePave = this.listaPaciente;
    this.listaPaciente = this.listaPaciente.filter((p: { pave: string }) => p.pave === 'SI');
    if (this.listaPaciente.length === 0) {
      Swal.fire(
        'Sin pacientes PAVE',
        'No se encontraron pacientes PAVE con pendientes de este medicamento, por lo tanto no se le dio tramite de envío de ningun mensaje!.',
        'info'
      );
      this.listaPaciente = this.listaPacientePave;
      return;
    }
    // Espera a que los mensajes se envíen antes de continuar
    await this.enviarMensajesConRetraso();
    this.listaPaciente = this.listaPacientePave;
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
    let contador = 0;

    for (const paciente of this.listaPaciente) {
      const textomensaje = `Hola *${paciente.pNombre}*! \n${paciente.bodega} te informa que el pendiente Nro. *${paciente.idFormula}* de tu medicamento. \n💊${paciente.nombreMedicamento} \nYa se encuentra disponible para que lo puedas recoger, en tu punto de entrega. \nRecuerde que debe traer su volante de pendiente. \n\n*POR FAVOR NO RESPONDER ESTE MENSAJE*`;

      const telefono = "57" + paciente?.telefono.replace(/\s/g, '');
      if (this.celularValido(paciente?.telefono.replace(/\s/g, ''))) {
        try {
          contador++;
          await this.whatsappService.enviarMensaje({ phone: telefono, message: textomensaje }).toPromise();
        } catch (error) {
          console.error(`❌ Error enviando a ${telefono}`, error);
        }
      } else {
        console.warn(`⚠️ Teléfono inválido: ${paciente.telefono}`);
      }
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos entre envíos
    }
    this.enviandoMensajes = false;
    await Swal.fire(
      '✔️ Mensajes procesados',
      `Se enviaron <strong>${contador}</strong> mensajes de un total de <strong>${this.listaPaciente.length}</strong>.<br>Los demás presentaron inconvenientes en el número de celular.`,
      'success'
    );
  }

  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem("nivel"));
    if (isNaN(nivelUsuario)) {
      //console.warn("El nivel del usuario no es válido o no está definido");
      return false;
    }
    return nivelUsuario >= nivelRequerido;
  }



  cancelarEdicion(itemt: any) {
    itemt.editing = false;
  }

  enEdicion(itemt: any) {
    this.pacienteService.getRegistroDocumento(itemt.numDocumento).subscribe(cliente => {
      if (cliente && cliente.length > 1) {
        Swal.fire({
          icon: 'error',
          title: `DOCUMENTO DUPLICADO`,
          text: `Este documento está duplicado en la base de datos. Identifique claramente al paciente para realizar la actualización.`,
        });
        return;
      }
      this.listaPaciente.forEach((p: any) => p.editing = false);
      itemt.editing = true;
      if (cliente && cliente.length === 1) {
        this.pacienteActual = cliente[0];
        this.generalForm.patchValue({
          direccion: this.pacienteActual.direccion,
          celularPrincipal: this.pacienteActual.celularPrincipal,
          celularSecundario: this.pacienteActual.celularSecundario,
          barrio: this.pacienteActual.barrio,
          email: this.pacienteActual.email
        });
      }
    });
  
  }

  validarCelular(celular: string): boolean {
    const regex = /^[3][0-9]{9}$/; // Ej. para Colombia: empieza por 3, 10 dígitos
    return regex.test(celular);
  }

  validarEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  guardarDatosContacto(itemt: any) {
    // Obtener y limpiar los valores del formulario
    this.pacienteActual.celularPrincipal = String(this.generalForm.get('celularPrincipal')!.value || '').trim();
    this.pacienteActual.celularSecundario = String(this.generalForm.get('celularSecundario')!.value || '').trim();
    this.pacienteActual.direccion = String(this.generalForm.get('direccion')!.value || '').trim();
    this.pacienteActual.barrio = String(this.generalForm.get('barrio')!.value || '').trim();
    this.pacienteActual.email = String(this.generalForm.get('email')!.value || '').trim().toLowerCase();


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
          itemt.editing = false;
          itemt.telefono=String(this.generalForm.get('celularPrincipal')!.value || '').trim();
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



}
