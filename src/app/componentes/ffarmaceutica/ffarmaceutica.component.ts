import { Component, Inject, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormaI } from 'src/app/modelos/forma.model';
import { FormaService } from 'src/app/servicios/forma.service';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-ffarmaceutica',
  templateUrl: './ffarmaceutica.component.html',
  styleUrls: ['./ffarmaceutica.component.css']
})
export class FfarmaceuticaComponent implements OnInit {

  generalForm!: FormGroup;
  nombrebtn!: string;
 // listaregistros: any;
  listaregistrosFiltrados: any;
  //banderaRegistro!: boolean;

  constructor(
    private fb: FormBuilder,
    private servicio: FormaService,
    public dialogRef: MatDialogRef<FfarmaceuticaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

   // this.cargarRegistros();
    this.nombrebtn = "Crear";
    //this.banderaRegistro = true;
  }

  ngOnInit(): void {
    this.crearFormulario();

    this.generalForm.get('nombre')!.valueChanges
    .pipe(
      debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
      switchMap(query =>  this.servicio.filtrarForma(query))
    )
    .subscribe(results => {       
      this.listaregistrosFiltrados = results        
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
/*
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
        idForma: [''],
        nombre: ['', [Validators.required]],
        estado: ['true', [Validators.required]],

      });
  }

 

  mostrarRegistro(itemt: any) {
    this.nombrebtn = "Actualizar"
    this.generalForm.setValue({
      idForma: itemt.idForma,
      nombre: itemt.nombre,
      estado: itemt.estado,
    })
  }

  

  create() {
    this.generalForm.value.usuario = localStorage.getItem("lidersistema");

    if (this.generalForm.valid) {
      if (this.nombrebtn == "Crear") {

        this.servicio.create(this.generalForm.value).subscribe(ciclo => {
          //this.cargarRegistros();
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La forma farmaceutica ha sido creado correctamente`,
          });
          this.generalForm.reset();
          this.nombrebtn = "Crear";
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo guardar la forma farmaceutica en la base de datos!',
              footer: err.mensaje //JSON.stringify(err)
            });
          }
        );
      }
      else {
        console.log(this.generalForm.value);
        this.servicio.update(this.generalForm.value).subscribe(ciclo => {

         // this.cargarRegistros();
          this.nombrebtn = "Crear";
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La forma farmaceutica ha sido actualizado correctameente`,
          });
          this.generalForm.reset();

        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo actualizar la forma farmaceutica en la base de datos!',
              footer: err.mensaje
            });
          });
      }

    } else {
      Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: 'Datos incompletos para crear la forma farmaceutica en la base de datos!'
      });

    }

  }


  eliminarRegistro(itemt: FormaI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `La forma farmaceutica `+ itemt.nombre + ` de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.delete(itemt.idForma).subscribe(resp => {
          this.listaregistrosFiltrados = this.listaregistrosFiltrados.filter((cli: FormaI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La forma farmaceutica ha sido eliminado correctamente.`,
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

