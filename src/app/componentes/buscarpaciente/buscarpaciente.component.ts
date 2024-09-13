import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs';
import { PacienteI } from 'src/app/modelos/paciente.model';
import { PacienteService } from 'src/app/servicios/paciente.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-buscarpaciente',
  templateUrl: './buscarpaciente.component.html',
  styleUrls: ['./buscarpaciente.component.css']
})
export class BuscarpacienteComponent {
  listaregistros: any;
  generalForm!: FormGroup;

  constructor(   
    private servicio: PacienteService,
    private fb: FormBuilder

  ) {

    this.generalForm = this.fb.group
      ({
        pNombre: [''],
        sNombre: [''],
        pApellido: [''],
        sApellido: [''],});

        this.generalForm.get('pNombre')!.valueChanges
        .pipe(
          debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir         
          switchMap(query => {
            const pNombre = this.generalForm.get('pNombre')?.value || '';
            const sNombre = this.generalForm.get('sNombre')?.value || '';
            const pApellido = this.generalForm.get('pApellido')?.value || '';
            const sApellido = this.generalForm.get('sApellido')?.value || '';          
            return this.servicio.filtrarPacientes(pNombre, sNombre, pApellido, sApellido);
          })  
        )
        .subscribe(results => {       
          this.listaregistros = results;    
        });
        

        this.generalForm.get('sNombre')!.valueChanges
        .pipe(
          debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir         
          switchMap(query => {
            const pNombre = this.generalForm.get('pNombre')?.value || '';
            const sNombre = this.generalForm.get('sNombre')?.value || '';
            const pApellido = this.generalForm.get('pApellido')?.value || '';
            const sApellido = this.generalForm.get('sApellido')?.value || '';          
            return this.servicio.filtrarPacientes(pNombre, sNombre, pApellido, sApellido);
          })  
        )
        .subscribe(results => {       
          this.listaregistros = results;    
        });

        this.generalForm.get('pApellido')!.valueChanges
        .pipe(
          debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir         
          switchMap(query => {
            const pNombre = this.generalForm.get('pNombre')?.value || '';
            const sNombre = this.generalForm.get('sNombre')?.value || '';
            const pApellido = this.generalForm.get('pApellido')?.value || '';
            const sApellido = this.generalForm.get('sApellido')?.value || '';          
            return this.servicio.filtrarPacientes(pNombre, sNombre, pApellido, sApellido);
          })  
        )
        .subscribe(results => {       
          this.listaregistros = results;  
          console.log(results);  
        });

        this.generalForm.get('sApellido')!.valueChanges
        .pipe(
          debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir         
          switchMap(query => {
            const pNombre = this.generalForm.get('pNombre')?.value || '';
            const sNombre = this.generalForm.get('sNombre')?.value || '';
            const pApellido = this.generalForm.get('pApellido')?.value || '';
            const sApellido = this.generalForm.get('sApellido')?.value || '';          
            return this.servicio.filtrarPacientes(pNombre, sNombre, pApellido, sApellido);
          })  
        )
        .subscribe(results => {       
          this.listaregistros = results;    
        });


   
  }

  eliminarRegistro(itemt: PacienteI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `El paciente ` + itemt.pNombre + ` de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.delete(itemt.idPaciente).subscribe(resp => {
          this.listaregistros = this.listaregistros.filter((cli: PacienteI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El paciente ha sido eliminado correctamente.`,
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
