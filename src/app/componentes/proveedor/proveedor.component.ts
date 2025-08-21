import { Component, Inject, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicoI } from 'src/app/modelos/medico.model';
import { debounceTime, map, Observable, of, switchMap } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProveedorService } from 'src/app/servicios/proveedor.service';

@Component({
  selector: 'app-proveedor',
  templateUrl: './proveedor.component.html',
  styleUrls: ['./proveedor.component.css']
})
export class ProveedorComponent {

  generalForm!: FormGroup;
  nombrebtn!: string;
  listaregistrosFiltrados: any;

  constructor(
    private fb: FormBuilder,
    private servicio: ProveedorService,
    public dialogRef: MatDialogRef<ProveedorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.nombrebtn = "Crear";

  }

  ngOnInit(): void {
    this.crearFormulario();

    this.generalForm.get('nombre')!.valueChanges
      .pipe(
        debounceTime(300),
        map(value => value?.trim()?.toLowerCase()),
        switchMap(query => this.servicio.filtrarProveedores(query))
      )
      .subscribe(results => {
        this.listaregistrosFiltrados = results;
      });

  }

  onNoClick(): void {
    this.dialogRef.close();
  }


  toUpperCase(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    const cursorPos = input.selectionStart || 0;
    const upperValue = input.value.toUpperCase();

    // Evitar reestablecer si no ha cambiado
    if (input.value !== upperValue) {
      this.generalForm.get(controlName)?.setValue(upperValue, { emitEvent: false });

      // Restaurar el cursor en el siguiente ciclo de renderizado
      setTimeout(() => {
        input.setSelectionRange(cursorPos, cursorPos);
      });
    }
  }


  /*FUNCION DE CREACION DEL FORMULARIO*/
  crearFormulario() {
    this.generalForm = this.fb.group
      ({
        id: [''],
        nit: ['', [Validators.required]],
        nombre: ['', [Validators.required]],
        estado: [true, [Validators.required]],
        direccion: [''],
        telefono: [''],
       

      });
  }

  buscarRegistro() {
    const numRegistro = this.generalForm.get('nit')?.value;
    if (numRegistro) {
      // Lógica para buscar el documento      
      this.servicio.buscarProveedorNit(numRegistro).subscribe(
        (respuesta) => {
          if (respuesta && Object.keys(respuesta).length > 0) { // Si es un objeto
            this.listaregistrosFiltrados = respuesta;
            Swal.fire({
              icon: 'info',
              title: 'EXISTE',
              text: `El nit ${numRegistro} que está ingresando ya existe con los datos de ${this.listaregistrosFiltrados[0].nombre}. Por favor verificar y/o actualizar el dato, recuerde no volverlo a crear!`,
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
      id: itemt.id,
      nit: itemt.nit,
      nombre: itemt.nombre,
      estado: itemt.estado,
      direccion: itemt.direccion,
      telefono: itemt.telefono,
     
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
            text: `El proveedor ha sido creado correctamente`,
          });
          this.generalForm.reset();
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo guardar el proveedor en la base de datos!',
              footer: err.mensaje //JSON.stringify(err)
            });
          }
        );
      }
      else {
        this.servicio.update(this.generalForm.value).subscribe(ciclo => {
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El proveedor ha sido actualizado correctameente`,
          });
          this.generalForm.reset();
          this.nombrebtn = "Crear"

        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo actualizar el proveedor en la base de datos!',
              footer: err.mensaje
            });
          });
      }

    } else {
      Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: 'Datos incompletos para crear el proveedor en la base de datos!'
      });
    }
  }


  eliminarRegistro(itemt: MedicoI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `El proveedor ` + itemt.nombre + ` de la base de datos.`,
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
            text: `El proveedor ha sido eliminado correctamente.`,
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

