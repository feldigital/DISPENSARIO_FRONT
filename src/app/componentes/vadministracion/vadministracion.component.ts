import { Component, Inject, OnInit } from '@angular/core';

import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ViaI } from 'src/app/modelos/via.model';
import { ViaService } from 'src/app/servicios/via.service';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-vadministracion',
  templateUrl: './vadministracion.component.html',
  styleUrls: ['./vadministracion.component.css']
})
export class VadministracionComponent implements OnInit {
  generalForm!: FormGroup;
  nombrebtn!: string;
  //listaregistros: any;
  listaregistrosFiltrados: any;
  //banderaRegistro!: boolean;

  constructor(
    private fb: FormBuilder,
    private servicio: ViaService,
    public dialogRef: MatDialogRef<VadministracionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    //this.cargarRegistros();
    this.nombrebtn = "Crear";
    //this.banderaRegistro = true;
  }

  ngOnInit(): void {
    this.crearFormulario();
    this.generalForm.get('nombre')!.valueChanges
    .pipe(
      debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
      switchMap(query => this.servicio.filtrarVia(query))
    )
    .subscribe(results => {       
      this.listaregistrosFiltrados = results        
    });
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

/*
  filtrarRegistros(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.length > 2) {
      filterValue = filterValue.toLocaleLowerCase();
      const filteredResults = this.listaregistros.filter((item: any) =>
        item.nombre.toLowerCase().includes(filterValue)
      );
      return of(filteredResults);
    }
    // Retornar la lista completa si no se cumplen las condiciones
    return of(this.listaregistros);
  }

  cargarRegistros() {

    this.servicio.getRegistros()
      .subscribe((resp: any) => {
        this.listaregistros = resp;
        this.listaregistrosFiltrados = resp;
      },
        (err: any) => { console.error(err) }
      );
  }

  */
  /*FUNCION DE CREACION DEL FORMULARIO*/
  crearFormulario() {
    this.generalForm = this.fb.group
      ({
        idVia: [''],
        nombre: ['', [Validators.required]],
        estado: ['true', [Validators.required]],

      });
  }

  mostrarRegistro(itemt: any) {
    this.nombrebtn = "Actualizar"
    this.generalForm.setValue({
      idVia: itemt.idVia,
      nombre: itemt.nombre,
      estado: itemt.estado,
    })

  }

  create() {
     if (this.generalForm.valid) {
      if (this.nombrebtn == "Crear") {
        this.servicio.create(this.generalForm.value).subscribe(ciclo => {
   //       this.cargarRegistros();
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La via de administración ha sido creado correctamente`,
          });
          this.generalForm.reset();
          this.nombrebtn = "Crear";
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo guardar la via de administración en la base de datos!',
              footer: err.mensaje //JSON.stringify(err)
            });
          }
        );
      }
      else {
        this.servicio.update(this.generalForm.value).subscribe(ciclo => {
         // this.cargarRegistros();
         this.nombrebtn = "Crear"; 
         Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La via de administración ha sido actualizado correctameente`,
          });
          this.generalForm.reset();

        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo actualizar la via de administración en la base de datos!',
              footer: err.mensaje
            });
          });
      }

    } else {
      Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: 'Datos incompletos para crear la via de administración en la base de datos!'
      });

    }

  }


  eliminarRegistro(itemt: ViaI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `La via de administración `+ itemt.nombre + ` de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.delete(itemt.idVia).subscribe(resp => {
          this.listaregistrosFiltrados = this.listaregistrosFiltrados.filter((cli: ViaI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La via de administración ha sido eliminado correctamente.`,
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

