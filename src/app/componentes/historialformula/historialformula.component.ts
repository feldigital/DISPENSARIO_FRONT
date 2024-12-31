import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormulaI } from 'src/app/modelos/formula.model';
import { FormulaService } from 'src/app/servicios/formula.service';
import { PacienteService } from 'src/app/servicios/paciente.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-historialformula',
  templateUrl: './historialformula.component.html',
  styleUrls: ['./historialformula.component.css']
})
export class HistorialformulaComponent implements OnInit, OnDestroy {

  listaFormula: any;
  pacienteActual: any;
  listaItemFactura: any;
  parametro: any;
  @Input() idPaciente: number = NaN;
  private intervalId: any;

  constructor(
    private servicio: PacienteService,
    private servicioformula: FormulaService,
    private activatedRoute: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    // Configurar un intervalo que verifique la condición cada minuto (60000 milisegundos)

    this.parametro = this.idPaciente
    this.activatedRoute.paramMap.subscribe(params => {
      this.parametro = params.get('id');
      if (this.parametro) {
        this.buscarRegistro(this.parametro);
      }
    });
    if (this.idPaciente) {
      this.buscarRegistro(this.idPaciente);
    }
    this.intervalId = setInterval(() => {
      this.listaFormula.forEach((formula: any) => {
        formula.showButton = this.ControlEliminar(formula);
      });
    }, 60000);
  }


  ngOnDestroy() {
    // Limpiar el intervalo cuando se destruya el componente
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onInputChange(event: any,itemt: any) {
    itemt.tipoRecibe = event.target.value.toUpperCase();
  }

  public buscarRegistro(id: number) {
    this.servicio.getRegistroId(id)
      .subscribe((resp: any) => {
        this.pacienteActual = resp;
        console.log(resp);
        this.listaFormula = resp.formulas;
        this.listaFormula = this.listaFormula.map((item: any) => ({
          ...item,
         // estado: false, // O cualquier lógica que determine el estado
          editing: false,
         
        }));

        this.listaFormula.sort((a: any, b: any) => b.idFormula - a.idFormula);
      });

  }


  public eliminarFormula(itemt: FormulaI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `La formula número ${itemt.idFormula} prescita del prestador  ${itemt.ips.nombre}  de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicioformula.delete(itemt.idFormula).subscribe(resp => {
          this.listaFormula = this.listaFormula.filter((cli: FormulaI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La formula número ${itemt.nroFormula} prescita del prestador ${itemt.ips.nombre} ha sido eliminado correctamente.`,
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

  public verDetalles(itemt: any) {
    let mensaje = `Medico que prescribe: ${itemt.medico.nombre} <br> <br>`;
    for (let i = 0; i < itemt.items.length; i++) {
      mensaje += (i + 1) + ` - ${itemt.items[i].medicamento.nombre} - Cantidad - ${itemt.items[i].cantidad}<br>`;
    }
    Swal.fire({
      icon: 'success',
      title: `Lista de medicamentos, formula Nro.  <b>${itemt.idFormula}</b>`,
      html: mensaje,
    });
  }

  public ControlEliminar(itemt: any): boolean {
    const fha = new Date();
    //const fechaSolicitud = new Date(itemt.fecSolicitud);
    const fechaSolicitud = itemt.fecSolicitud ? new Date(itemt.fecSolicitud) : new Date();
    // Calcular la diferencia en milisegundos entre la fecha actual y la fecha de solicitud
    const diferenciaEnMilisegundos = fha.getTime() - fechaSolicitud.getTime();
    // Convertir la diferencia a minutos
    const diferenciaEnMinutos = diferenciaEnMilisegundos / (1000 * 60);
    // console.log(diferenciaEnMinutos);
    // Devolver true si la diferencia es menor a 5 minutos
    return diferenciaEnMinutos < 5;
  }

  public guardarEntregaFormula(itemt: any) {
    let bodegaString = sessionStorage.getItem("bodega");
    let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
    let funcionario = sessionStorage.getItem("nombre");
    if (funcionario && bodegaString) {
      const fechaActual = new Date(); // Obtener la fecha actual
      const fechaPrescribe = new Date(itemt.fecPrescribe); // Convertir itemt.fecPrescribe a objeto Date
      // Formatear la fecha a 'dd/MM/yyyy'
    /*  const fechaFormateada = fechaPrescribe.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
*/
      const resetHora = (fecha: Date): Date => {
        return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      };
      
      // Reseteamos las horas
      const fechaActualSinHora = resetHora(fechaActual);
      const fechaPrescribeSinHora = resetHora(fechaPrescribe);
      
     
      if (fechaPrescribeSinHora <= fechaActualSinHora) {
        const controlPrescribe = new Date(fechaActual);
        controlPrescribe.setDate(fechaActual.getDate() - 30);
        if (fechaPrescribe >= controlPrescribe) {

          if(itemt.tipoRecibe && itemt.documentoRecibe){

          Swal.fire({
            title: 'Confirma la entrega',
            text: `Se procedera a hacer el proceso de descargue de los medicamentos del inventario de la bodega al que esta suscrito el funcionario ` + funcionario!,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, Entregar!'
          }).then((result) => {
            if (result.isConfirmed) {

              this.servicioformula.saveEntregaFormula(itemt.idFormula, bodega, funcionario!, "Presencial",itemt.tipoRecibe,itemt.documentoRecibe)
                .subscribe({
                  next: (data: any) => {
                    this.router.navigate(['/menu/entrega', itemt.idFormula]);
                  },
                  error: (err) => {
                    console.error('Error al guardar la entrega', err);
                  }
                });
            }
          });
        }
        else{
          Swal.fire({
            icon: 'error',
            title: `Quien recibe!`,
            text: 'No ha diligenciado los datos de quien recibe los medicamentos prescritos en la formula número ' + itemt.idFormula + ' recuerde debe ser un mayor de edad',
          });
        }


        } else {
          Swal.fire({
            icon: 'error',
            title: `Formula expiró!`,
            text: `La fórmula expiró, ya no puede ser entregada debio ser reclamada hasta 30 dias despues de su fecha de prescripción ${fechaActualSinHora}`,

          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: `Verificar!`,
          text: `La fórmula aún no está habilitada para la entrega, estará disponible a partir del ${fechaActualSinHora}`,
        });
      }
    }
    else {
      Swal.fire({
        icon: 'error',
        title: `Verificar!`,
        text: "Usuario no esta  logueado para realizar la dispensación de medicamentos, por favor inicie sesión!",
      });
    }
  }

  public editarFormula(itemt: any) {
    Swal.fire({
      icon: 'info',
      title: `en construcción`,
      text: "En contsrucción",
    });
  }


  //placeholder="Ingrese la observación de la anulación"


  public anularFormula(itemt: any) {
    let funcionario = sessionStorage.getItem("nombre");
    Swal.fire({
      title: 'Anular Fórmula',
      html: `             
      <div>Ingrese la observación que se registrará en la base de datos para verificar el motivo por el cual se está anulando la fórmula:</div>
      <textarea id="obsanulacion" placeholder="Ingrese la observación de la anulación" 
        style="width: 100%; height: 110px; padding: 10px; font-size: 14px; border-radius: 20px;"></textarea>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, anular!'
    }).then((result) => {
      if (result.isConfirmed) {

        const obsanulacion = (document.getElementById('obsanulacion') as HTMLTextAreaElement).value;
        // if (obsanulacion.length > 10){
        if (obsanulacion.length > 10 && funcionario) {
          this.servicioformula.anularFormula(itemt.idFormula, funcionario!, obsanulacion).subscribe(
            (resp) => {
              this.buscarRegistro(resp.paciente.idPaciente);
              // Mostrar Swal solo si el servicio responde correctamente
              Swal.fire({
                icon: 'success',
                title: 'Ok',
                text: `La fórmula número ${itemt.idFormula} se ha anulada correctamente.`,
              });
            },
            (err) => {
              console.error('Error del servidor:', err); // Verificar el error
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err?.mensaje || 'Ocurrió un error al intentar anular la fórmula.',
              });
            }
          );
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No ha diligenciado caracteres suficiente en el motivo por el cual se va a anular la fórmula (mínimo 10 carácteres).',
          });
        }
      }
    });
  }



  informeAnulacion(item: any) {
    Swal.fire({
      icon: 'info',
      title: `Información`,
      text: 'Formula numero ' + item.idFormula + ' anulada por funcionario ' + item.funcionarioanula + ' observación ' + item.observacion,
    });
  }

  editarquienRecibe(itemt: any) {
    itemt.editing = true;
  }

  cancelarquienRecibe(itemt: any) {
    itemt.editing = false;
  }

  guardarquienRecibe(itemt: any) {
    itemt.editing = false;
  }

  onRecibeChange(event: Event, itemt: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (this.CalcularEdad(this.pacienteActual.fecNacimiento) > 17) {
        itemt.tipoRecibe = this.pacienteActual.tipoDoc;
        itemt.documentoRecibe = this.pacienteActual.numDocumento;
       
      }
      else
      {
        itemt.tipoRecibe = "";
        itemt.documentoRecibe = "";
        Swal.fire({
          icon: 'error',
          title: `Edad no permitida!`,
          text: 'El paciente no tiene la edad para recibir los medicamentos de la formula número ' + itemt.idFormula + ' por favor agregue los datos del tutor responsable',
        });
      }
    } else {
      itemt.tipoRecibe = "";
      itemt.documentoRecibe = "";
    }
  }

  CalcularEdad(fn: Date): number {
    if (fn !== null && fn !== undefined) {
      const convertAge = new Date(fn);
      const timeDiff = Math.abs(Date.now() - convertAge.getTime());
      let edad = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);
      if (edad) {
        return edad;
      }
    }
    return 0;
  }

  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}
