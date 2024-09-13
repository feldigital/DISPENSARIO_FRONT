import { Component, Inject, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IpsService } from 'src/app/servicios/ips.service';
import { IpsI } from 'src/app/modelos/ips.model';
import { debounceTime, switchMap } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-ips',
  templateUrl: './ips.component.html',
  styleUrls: ['./ips.component.css']
})
export class IpsComponent {

  generalForm!: FormGroup;
  nombrebtn!: string;
  //listaregistros: any;
  listaregistrosFiltrados: any;
  //banderaRegistro!: boolean;

  constructor(
    private fb: FormBuilder,
    private servicio: IpsService,
    public dialogRef: MatDialogRef<IpsComponent>,
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
      switchMap(query => this.servicio.filtrarIpss(query))
    )
    .subscribe(results => {       
      this.listaregistrosFiltrados = results        
    });
  }

  convertirAMayusculas(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.generalForm.get('nombre')?.setValue(input.value, { emitEvent: false });
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


  cargarRegistros(term: string) {

    this.servicio.filtrarIpss(term)
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
        idIps: [''],
        nit: [''],
        codHabilitacion: [''],
        nombre: ['', [Validators.required]],
        estado: ['true', [Validators.required]],

      });
  }
  onNoClick(): void {
    this.dialogRef.close();
  }


  mostrarRegistro(itemt: any) {
    console.log(itemt);
    this.nombrebtn = "Actualizar"
    this.generalForm.setValue({
      idIps: itemt.idIps,
      nit: itemt.nit,
      codHabilitacion: itemt.codHabilitacion,
      nombre: itemt.nombre,
      estado: itemt.estado,
    })
  }

  create() {
    this.generalForm.value.usuario = localStorage.getItem("lidersistema");
    if (this.generalForm.valid) {
      if (this.nombrebtn == "Crear") {
        this.servicio.create(this.generalForm.value).subscribe(nuevaIps => {
         // this.cargarRegistros();
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La IPS ha sido creado correctamente`,
          });
          this.generalForm.reset();
          this.nombrebtn = "Crear";
          this.dialogRef.close(nuevaIps);
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo guardar la IPS en la base de datos!',
              footer: err.mensaje //JSON.stringify(err)
            });
          }
        );
      }
      else {
        console.log(this.generalForm.value);
        this.servicio.update(this.generalForm.value).subscribe(nuevaIps => {
          this.nombrebtn = "Crear";
          //this.cargarRegistros();
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La IPS ha sido actualizado correctameente`,
          });
          this.dialogRef.close(nuevaIps);
          this.generalForm.reset();


        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo actualizar la IPS en la base de datos!',
              footer: err.mensaje
            });
          });
      }

    } else {
      Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: 'Datos incompletos para crear la IPS en la base de datos!'
      });

    }

  }


  eliminarRegistro(itemt: IpsI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `La IPS` + itemt.nombre + ` de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.delete(itemt.idIps).subscribe(resp => {
          this.listaregistrosFiltrados = this.listaregistrosFiltrados.filter((cli: IpsI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `La IPS ha sido eliminado correctamente.`,
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

