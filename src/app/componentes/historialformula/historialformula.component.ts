import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormulaService } from 'src/app/servicios/formula.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-historialformula',
  templateUrl: './historialformula.component.html',
  styleUrls: ['./historialformula.component.css']
})
export class HistorialformulaComponent implements OnInit {

  listaFormula: any;
  pacienteActual: any;
  listaItemFactura: any;
  parametro: any;
  @Input() idPaciente: number = NaN;
  generalForm!: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private servicioformula: FormulaService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder) {
    // Calcula la fecha actual
    const currentDate = new Date();
    const currentDateFutura = new Date(currentDate);
    currentDateFutura.setDate(currentDate.getDate() + 90);
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 90);
    //  this.spinner.show();
    // Inicializa el formulario y define los FormControl para fechainicial y fechafinal
    this.generalForm = this.fb.group({
      fechainicial: [date30DaysAgo.toISOString().split('T')[0]],
      fechafinal: [currentDateFutura.toISOString().split('T')[0]],
    });
  }


  ngOnInit(): void {
    this.parametro = this.activatedRoute.snapshot.paramMap.get('id') || this.idPaciente;
    if (this.parametro) {
      this.buscarRegistro(this.parametro);

    }
  }



  onInputChange(event: any, itemt: any) {
    itemt.tipoRecibe = event.target.value.toUpperCase();
  }

  public buscarRegistro(id: number) {
    this.servicioformula.getFormulaIdPaciente(id, this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value)
      .subscribe((resp: any) => {
        this.pacienteActual = resp[0]?.paciente;
        // console.log(this.pacienteActual);    
        this.listaFormula = resp //.formulas;
        this.listaFormula = this.listaFormula.map((item: any) => ({
          ...item,
          // estado: false, // O cualquier lógica que determine el estado
          editing: false,
          editingSoporte: false,
        }));
        this.listaFormula.sort((a: any, b: any) => b.idFormula - a.idFormula);
        console.log(this.listaFormula);

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


  public guardarEntregaFormula(itemt: any) {
    let bodegaString = sessionStorage.getItem("bodega");
    let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
    let funcionario = sessionStorage.getItem("nombre");
    if (funcionario && bodegaString) {
      const fechaActual = new Date(); // Obtener la fecha actual
      const fechaPrescribe = new Date(itemt.fecPrescribe); // Convertir itemt.fecPrescribe a objeto Date
      // Formatear la fecha a 'dd/MM/yyyy'

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

          if (itemt.tipoRecibe && itemt.documentoRecibe) {

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

                this.servicioformula.saveEntregaFormula(itemt.idFormula, bodega, funcionario!, "Presencial", itemt.tipoRecibe, itemt.documentoRecibe)
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
          else {
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
      else {
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



  onFileSelected(event: any, itemt:any) {
    this.selectedFile = event.target.files[0];

    if (!this.selectedFile) {
    return;
  }

  // Validar que sea PDF
  const isPdf = this.selectedFile.type === 'application/pdf' || this.selectedFile.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
     Swal.fire({
          icon: 'warning',
          title: 'ERROR PDF ',
          text: '❌ Solo se permiten archivos PDF como soporte de la formula',
        });
    
    event.target.value = ''; // Limpiar selección del input
     this.selectedFile =null;
    return;
  }



  if(itemt.urlFormula){
  Swal.fire({
      title: 'Reemplazar el Soporte',
      text: 'Esta seguro de reemplzar el soporte existente de la formula por este otro, este cambio ya no se podra reversar',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, reemplazar!'
    }).then((result) => {
      if (result.isConfirmed) {

       this.onUpload(itemt);
       
        
      }
    });

  }
  else{

  this.onUpload(itemt);
  } 
  }

  onUpload(item: any) {
  if (!this.selectedFile) {
     Swal.fire({
          icon: 'info',
          title: 'Pendiente',
          text: `No se ha seleccionado el soporte en DPF de la fórmula Nro. ${item.idFormula}. para ser cargada a la nube`,
        });
        return;
  }

     this.servicioformula.subirFormula(this.selectedFile, item.idFormula).subscribe({
      next: (resp: string) => {
        item.urlFormula = resp;
        item.editingSoporte = false;
        Swal.fire({
          icon: 'success',
          title: 'Ok',
          text: `El soporte de la fórmula Nro. ${item.idFormula} fue cargado correctamenteen el bucket S3 ${resp}`,
        });
      },
      error: (err) => {
        console.error("❌ Error al subir:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Error al cargar el soporte de la fórmula Nro. ${item.idFormula}.`,
        });
      }
    });
  
}

verArchivo(url: string) {
  // Si la URL es pública o accesible, se abre en nueva pestaña
  window.open(url, '_blank');
}

  public editarSoporte(itemt: any) {
    this.listaFormula.forEach((p: any) => p.editingSoporte = false);
    itemt.editingSoporte = true;


  }
  public cancelSoporte(itemt: any) {
    itemt.editingSoporte = false;
  }


  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }


  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem("nivel"));
    if (isNaN(nivelUsuario)) {
      //console.warn("El nivel del usuario no es válido o no está definido");
      return false;
    }
    return nivelUsuario >= nivelRequerido;
  }

}
