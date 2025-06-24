
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { BodegaService } from 'src/app/servicios/bodega.service';
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
  totalCantidadEntregada:number =0;


  constructor(
    private servicio: BodegaService,   
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
        if (this.medicamentoActual) {
          this.buscarRegistro(this.medicamentoActual, this.parametro);
        }
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
    if (idMedicamento) {
      // Limpiar listas antes de cargar nueva data
      this.listaentregas = [];
      this.totalCantidadEntregada =0;
      // Mostrar spinner mientras carga
      Swal.fire({
        title: 'Cargando registros...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.formulaService.getMedicamentoentregadoPaciente(idMedicamento, idBodega, this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value)
        .subscribe((resp: any) => {
          this.listaentregas = resp;        
          Swal.close(); // ✅ Cerrar el spinner al terminar correctamente          
          const totalEntregado = this.listaentregas.reduce((sum: number, item: any) => {
            return sum + (item.cantidadEntrega || 0); // usa 0 si el valor es null/undefined
          }, 0);

          this.totalCantidadEntregada = totalEntregado;
        },
          (error) => {
            console.error('❌ Error cargando registros', error);
            Swal.close(); // 🚨 Primero cerramos el spinner
            Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
          }
        );
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

