import { Component, Inject, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicoService } from 'src/app/servicios/medico.service';
import { MedicoI } from 'src/app/modelos/medico.model';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-medicos',
  templateUrl: './medicos.component.html',
  styleUrls: ['./medicos.component.css']
})
export class MedicosComponent {
  generalForm!: FormGroup;
  nombrebtn!: string;
  listaregistrosFiltrados: any;
 
  constructor(
    private fb: FormBuilder,
    private servicio: MedicoService,
    public dialogRef: MatDialogRef<MedicosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
 
    this.nombrebtn = "Crear";
 
  }

  ngOnInit(): void {
    this.crearFormulario();
    this.generalForm.get('nombre')!.valueChanges
    .pipe(
      debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
      switchMap(query => this.servicio.filtrarMedicos(query))
    )
    .subscribe(results => {       
      this.listaregistrosFiltrados = results        
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  convertirAMayusculas(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.generalForm.get('nombre')?.setValue(input.value, { emitEvent: false });
  }

  convertirAMayusculasEspecialidad(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.generalForm.get('especialidad')?.setValue(input.value, { emitEvent: false });
  }


  /*FUNCION DE CREACION DEL FORMULARIO*/
  crearFormulario() {
    this.generalForm = this.fb.group
      ({
        idMedico: [''],
        registroMedico: ['', [Validators.required]],
        nombre: ['', [Validators.required]],
        estado: [true, [Validators.required]],
        especialidad: ['', [Validators.required]],

      });
  }

  buscarRegistro() {
    const numRegistro = this.generalForm.get('registroMedico')?.value;

    console.log("Esto es lo que voy a buscar en la base de datos:"+ numRegistro);
    if (numRegistro) {
      // Lógica para buscar el documento      
      this.servicio.buscarMedicosRegistro(numRegistro).subscribe(
        (respuesta) => {
          if (respuesta && Object.keys(respuesta).length > 0) { // Si es un objeto
            this.listaregistrosFiltrados = respuesta;
            Swal.fire({
              icon: 'info',
              title: 'EXISTE',
              text: `El número de registro ${numRegistro} que está ingresando ya existe con los datos de ${this.listaregistrosFiltrados[0].nombre}. Por favor verificar y/o actualizar el dato, recuerde no volverlo a crear!`,
            });
          } else {
            console.log("La respuesta está vacía o no tiene datos relevantes.");
          }
          
        },
        (error) => {
          console.error('Error al buscar el documento', error);
        }
      );
    }

  }

  mostrarRegistro(itemt: any) {
   
    this.nombrebtn = "Actualizar"
    this.generalForm.setValue({
      idMedico: itemt.idMedico,
      registroMedico: itemt.registroMedico,
      nombre: itemt.nombre,
      estado: itemt.estado,
      especialidad: itemt.especialidad,
    })

  }

  create() {
    
    if (this.generalForm.valid) {
      if (this.nombrebtn == "Crear") {
        this.servicio.create(this.generalForm.value).subscribe(nuevoMedico => {
          this.dialogRef.close(nuevoMedico);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El médico ha sido creado correctamente`,
          });
          this.generalForm.reset();
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo guardar el médico en la base de datos!',
              footer: err.mensaje //JSON.stringify(err)
            });
          }
        );
      }
      else {
        console.log(this.generalForm.value);
        this.servicio.update(this.generalForm.value).subscribe(ciclo => {  
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El médico ha sido actualizado correctameente`,
          });
          this.generalForm.reset();
           this.nombrebtn = "Crear"

        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo actualizar el médico en la base de datos!',
              footer: err.mensaje
            });
          });
      }

    } else {
      Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: 'Datos incompletos para crear el médico en la base de datos!'
      });
    }
  }


  eliminarRegistro(itemt: MedicoI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `El médico ` + itemt.nombre + ` de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.delete(itemt.idMedico).subscribe(resp => {
          this.listaregistrosFiltrados = this.listaregistrosFiltrados.filter((cli: MedicoI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El médico ha sido eliminado correctamente.`,
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



  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }


}

