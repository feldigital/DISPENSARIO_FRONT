
import { Component, Input, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, Observable, of, switchMap } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { OrdendespachoService } from 'src/app/servicios/ordendespacho.service';
import Swal from 'sweetalert2';
import { FormulaService } from 'src/app/servicios/formula.service';

@Component({
  selector: 'app-medicamentosentregados',
  templateUrl: './medicamentosentregados.component.html',
  styleUrls: ['./medicamentosentregados.component.css']
})
export class MedicamentosentregadosComponent {

  listaentregas: any = [];
  parametro: any;
  generalForm!: FormGroup;
  listaregistros: any;
  medicamentosFiltrados: any[] = [];
  medicamentoActual: any = NaN;
  

  constructor(
    private servicio: BodegaService,  
    private formulaservicio: FormulaService,
    private formulaService: FormulaService,

    private fb: FormBuilder) {
    // Calcula la fecha actual
    const currentDate = new Date();
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 90);
    //  this.spinner.show();
    // Inicializa el formulario y define los FormControl para fechainicial y fechafinal
    this.generalForm = this.fb.group({
      idBodega: [''],
      fechainicial: [date30DaysAgo.toISOString().split('T')[0]],
      fechafinal: [currentDate.toISOString().split('T')[0]],
      medicamento: [''],
    });


  }

  ngOnInit(): void {
    this.parametro = parseInt(sessionStorage.getItem('bodega') || '0', 10);

    this.servicio.getRegistrosActivos().subscribe(
      (resp: any) => {
        this.listaregistros = resp.filter((registro: any) => registro.dispensa === true);
        this.listaregistros.sort((a: any, b: any) => {
          const comparacionPorNombre = a.nombre.localeCompare(b.nombre);
          if (comparacionPorNombre === 0) {
            return a.puntoEntrega.localeCompare(b.puntoEntrega);
          }
          return comparacionPorNombre;
        });

        // Establecer el valor del select después de que se cargan los registros
        if (this.parametro) {
          this.generalForm.patchValue({ idBodega: +this.parametro });          
        }
      },
      (err: any) => {
        console.error(err);
      }
    );



    // Escuchar cambios en el select de bodegas
    this.generalForm.get('idBodega')!.valueChanges.subscribe((nuevoIdBodega: number) => {
      if (nuevoIdBodega) {
        this.parametro = nuevoIdBodega;  
        if (this.medicamentoActual){ 
        this.buscarRegistro(this.medicamentoActual, this.parametro);}
      }
    });

    this.generalForm.patchValue({ idBodega: this.parametro });

    this.generalForm.get('medicamento')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir          
        switchMap(query => {
          return this.formulaService.filtrarMedicamentos(query);
        })
      )
      .subscribe(results => {
        this.medicamentosFiltrados = results;
      });


  }


  seleccionarMedicamento(event: MatAutocompleteSelectedEvent): void {
    this.medicamentoActual = event.option.value.idMedicamento;
    this.generalForm.get('medicamento')?.setValue(event.option.value.nombre);
    this.buscarRegistro(this.medicamentoActual, this.parametro);
  }

  public buscarRegistro(idMedicamento: number, idBodega: number) {
    if(idMedicamento){
    this.formulaService.getMedicamentoentregadoPaciente(idMedicamento, idBodega, this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value)
      .subscribe((resp: any) => {
        this.listaentregas = resp
        });
    }
    else {
      Swal.fire({
        icon: 'error',
        title: `Verificar`,
        text: `No ha seleccionado el medicamento sobre el cual va a realizar la busqueda!.`,
      });

    }
  }


  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}

