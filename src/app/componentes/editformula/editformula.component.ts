import { Component, OnInit } from '@angular/core';
import { FormulaI } from 'src/app/modelos/formula.model';
import { PacienteService } from 'src/app/servicios/paciente.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { map, debounceTime, switchMap } from 'rxjs/operators';
import { FormulaService } from 'src/app/servicios/formula.service';
import { MedicamentoI } from 'src/app/modelos/medicamento.model';
import { ItemFormulaI } from 'src/app/modelos/itemformula.model';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MedicamentoService } from 'src/app/servicios/medicamento.service';
import { MedicoService } from 'src/app/servicios/medico.service';
import { IpsService } from 'src/app/servicios/ips.service';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { MatDialog } from '@angular/material/dialog';
import { IpsComponent } from '../ips/ips.component';
import { MedicosComponent } from '../medicos/medicos.component';



@Component({
  selector: 'app-editformula',
  templateUrl: './editformula.component.html',
  styleUrls: ['./editformula.component.css']
})
export class EditformulaComponent implements OnInit {

  formula: FormulaI = new FormulaI();
  facturaForm!: FormGroup;
  listaMedicamento: any;
  pacienteActual: any;
  pacienteNuevo: any;
  bodegaActual: any;
  mostrarComponente: Boolean = false;
  existencias: { [key: number]: number } = {};
  hoy!: string;
  minimohoy!: string;
  comentarioVisible: boolean = false;
  mensajeComentario: string = '';
  mensajeErrorDx: string = '';
  fechaActual!: Date;
  dxValido: boolean = true;
  //@Output() formulaAgregada = new EventEmitter<void>();  
  readonly formasConCantidadHabilitada = [3, 15, 19, 20, 22, 24, 116];
  frecuencias = [
    { nombre: '1 Cada 24 Horas', multiplicador: 1, valor: '1 Cada 24 Horas' },
    { nombre: '1 Cada 12 Horas', multiplicador: 2, valor: '1 Cada 12 Horas' },
    { nombre: '1 Cada 8 Horas', multiplicador: 3, valor: '1 Cada 8 Horas' },
    { nombre: '1 Cada 6 Horas', multiplicador: 4, valor: '1 Cada 6 Horas' },
    { nombre: '1 Cada 4 Horas', multiplicador: 6, valor: '1 Cada 4 Horas' },
    { nombre: '1 Despues de cada comida', multiplicador: 3, valor: '1 Despues de cada comida' },
    { nombre: '1 Cada 15 dias', multiplicador: 2, valor: '1 Cada 15 dias' },
    { nombre: '1 Cada Mes', multiplicador: 1, valor: '1 Cada Mes' },
    { nombre: '1 Cada Trimestre', multiplicador: 1, valor: '1 Cada Trimestre' },
    { nombre: '2 Cada 24 Horas', multiplicador: 2, valor: '2 Cada 24 Horas' },
    { nombre: '2 Cada 12 Horas', multiplicador: 4, valor: '2 Cada 12 Horas' },
    { nombre: '2 Cada 8 Horas', multiplicador: 6, valor: '2 Cada 8 Horas' },
    { nombre: '2 Cada 6 Horas', multiplicador: 8, valor: '2 Cada 6 Horas' },
    { nombre: '2 Cada 4 Horas', multiplicador: 12, valor: '2 Cada 4 Horas' },
    { nombre: '3 Cada 8 Horas', multiplicador: 9, valor: '3 Cada 8 Horas' },
    { nombre: '4 Cada 8 Horas', multiplicador: 12, valor: '4 Cada 8 Horas' },
    { nombre: '2 Despues de cada comida', multiplicador: 6, valor: '2 Despues de cada comida' },
    { nombre: '1 Cada 7 dias', multiplicador: 4, valor: '1 Cada 7 dias' },
    { nombre: '2 Cada 15 dias', multiplicador: 4, valor: '2 Cada 15 dias' },
    { nombre: '2 Cada Mes', multiplicador: 2, valor: '2 Cada Mes' },
    { nombre: '2 Cada Trimestre', multiplicador: 2, valor: '2 Cada Trimestre' },
    { nombre: 'Dosis unica', multiplicador: 1, valor: 'Dosis unica' }

  ];


  medicamentosFiltrados: any[] = [];
  medicosFiltrados: any[] = [];
  ipsFiltrados: any[] = [];
  editarPaciente: boolean = false;


  constructor(private pacienteService: PacienteService,
    private formulaService: FormulaService,
    private medicamentoService: MedicamentoService,
    private medicoService: MedicoService,
    private ipsService: IpsService,
    private bodegaService: BodegaService,
    private router: Router,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog) {
    this.facturaForm = this.formBuilder.group({
      idFormula: [''],
      nroFormula: ['N/A'],
      observacion: [''],
      ips: ['', Validators.required],
      medico: ['', Validators.required],
      fecPrescribe: ['', Validators.required],
      fecSolicitud: [''],
      total: [''],
      paciente: ['', Validators.required],
      items: this.formBuilder.array([]),
      estado: [false],
      medicamento: [''],
      cieP: ['', [Validators.required, Validators.maxLength(4)]],
      cieR1: ['', [Validators.maxLength(4)]],
      cieR2: ['', [Validators.maxLength(4)]],
      cieR3: ['', [Validators.maxLength(4)]],
      origenurgencia: [false],
      programa: ['', Validators.required],
      cobroCM: [false],
      pgp: [false],
      valorCM: ['0'],
      numDocumento: [''],

    });
  }

  ngOnInit() {
    // this.deshabilitarControles();
    this.activatedRoute.paramMap.subscribe(params => {
      let formulaId = +params.get('id')!;
      if (formulaId) {
        // Procesar la formula formulaService 
        this.formulaService.getFormulaId(formulaId).subscribe(reg => {
          this.formula = reg;

          if (reg) {
            this.formula.items = this.formula.items.map((item: any) => ({
              ...item,
              habilitarCantidad: this.formasConCantidadHabilitada.includes(item.medicamento.forma.idForma),
            }));

            // Llenar existencias
            this.formula.items.forEach((item: any) => {
              const idMedicamento = item.medicamento.idMedicamento;
              this.existenciaAcutal(idMedicamento, bodega);
            });
          }

          this.mostrarComponente = true;
          this.pacienteActual = reg.paciente;
          this.mostrarRegistro(reg);
          this.facturaForm.get('cobroCM')?.setValue(this.cobroCuotaModeradora());
        });
      }

      if (!this.tieneAcceso(4)) {
        this.facturaForm.get('idFormula')?.disable();
      }

    });

    this.facturaForm.get('medico')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
        switchMap(query => this.medicoService.filtrarMedicos(query))
      )
      .subscribe(results => {
        this.medicosFiltrados = results
      });


    this.facturaForm.get('ips')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
        switchMap(query => this.ipsService.filtrarIpss(query))
      )
      .subscribe(results => {
        this.ipsFiltrados = results;
      });


    this.facturaForm.get('medicamento')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir          
        switchMap(query => {
          if (this.pacienteActual && this.pacienteActual.eps) {
            return this.formulaService.filtrarMedicamentosEps(query, this.pacienteActual.eps.codigo);
          } else {
            // Si no hay un pacienteActual o su eps es indefinido, retorna un array vacío
            return of([]);
          }
        })
      )

      .subscribe(results => {
        this.medicamentosFiltrados = results;
      });



    let bodegaString = sessionStorage.getItem("bodega");
    let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
    this.bodegaService.getRegistroId(bodega)
      .subscribe((resp: any) => {
        this.bodegaActual = resp;
      },
        (err: any) => { console.error(err) }
      );


    this.fechaActual = new Date();
    const date30DaysAgo = new Date(this.fechaActual);
    date30DaysAgo.setDate(this.fechaActual.getDate() - 5);
    this.hoy = this.fechaActual.toISOString().split('T')[0];  // Formato YYYY-MM-DD
    this.minimohoy = date30DaysAgo.toISOString().split('T')[0];  // Formato YYYY-MM-DD
  }


  mostrarRegistro(itemt: any) {
    var fp = new Date(itemt.fecPrescribe);
    var fs = new Date(itemt.fecSolicitud);
    this.facturaForm.patchValue({
      idFormula: itemt.idFormula,
      nroFormula: itemt.nroFormula,
      observacion: itemt.observacion,
      ips: itemt.ips,
      medico: itemt.medico,
      fecPrescribe: fp.toJSON().slice(0, 10),
      fecSolicitud: fs.toJSON().slice(0, 10),
      total: itemt.total,
      paciente: itemt.paciente.numDocumento,
      items: itemt.items,
      estado: itemt.estado,
      medicamento: itemt.medicamento,
      cieP: itemt.cieP,
      cieR1: itemt.cieR1,
      cieR2: itemt.cieR2,
      cieR3: itemt.cieR3,
      cobroCM: itemt.cobroCM,
      valorCM: itemt.valorCM,
      continuidad: itemt.continuidad,
      pgp: itemt.pgp,
      origenurgencia: itemt.origenurgencia,
      programa: itemt.programa.codigo,
      //frecuencia: itemt.frecuencia,
    })
  }




  openDialogIps(): void {
    const dialogRef = this.dialog.open(IpsComponent, {
      width: '400px',
      data: { /* puedes pasar datos iniciales aquí */ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí puedes manejar los datos devueltos, por ejemplo, seleccionar la IPS recién creada
        this.facturaForm.get('ips')!.setValue(result.nombre);
      }
    });
  }


  openDialogMedico(): void {
    const dialogRef = this.dialog.open(MedicosComponent, {
      width: '400px',
      data: { /* puedes pasar datos iniciales aquí */ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí puedes manejar los datos devueltos, por ejemplo, seleccionar la IPS recién creada
        this.facturaForm.get('medico')!.setValue(result.nombre);
      }
    });
  }

  cobroCuotaModeradora(): boolean {
    if (this.pacienteActual && this.pacienteActual.regimen) {
      return this.pacienteActual.regimen === 'C';
    }
    return false; // O cualquier valor por defecto que consideres apropiado


  }

  onOptionSelectedIps(option: any) {
    this.facturaForm.get('ips')?.setValue(option);
  }


  onOptionSelectedMedico(option: any) {
    this.facturaForm.get('medico')?.setValue(option);
  }

  displayIps(ips?: any): string {
    return ips ? ips.nombre : '';
  }

  // Función para mostrar el nombre del médico en el autocompletar
  displayMedico(medico?: any): string {
    return medico ? medico.nombre : '';
  }

  autocompletadoValido(options: any[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const valorIngresado = control.value;
      const valido = options.some(option => option.nombre === valorIngresado);
      return !valido ? { 'opcionInvalida': { value: control.value } } : null;
    };
  }

  public buscarFormula() {
    let bodega = parseInt(sessionStorage.getItem("bodega") || "0", 10);
    this.formula = new FormulaI();
    this.pacienteActual = {};
    this.mostrarComponente = false;
    this.formulaService.getFormulaId(this.facturaForm.get('idFormula')!.value).subscribe(reg => {

      if (reg) {
        this.formula = reg;
        //this.formula = Object.assign(new FormulaI(), reg);
        this.formula.items = this.formula.items.map((item: any) => ({
          ...item,
          habilitarCantidad: this.formasConCantidadHabilitada.includes(item.medicamento.forma.idForma),
        }));

        // Llenar existencias
        this.formula.items.forEach((item: any) => {
          const idMedicamento = item.medicamento.idMedicamento;
          this.existenciaAcutal(idMedicamento, bodega);
        });

        this.mostrarComponente = true;
        this.pacienteActual = reg.paciente;
        this.mostrarRegistro(reg);
        this.ValidaPaciente();
        this.facturaForm.get('cobroCM')?.setValue(this.cobroCuotaModeradora());
      } else {
        Swal.fire({
          icon: 'info',
          title: `Información`,
          text: `No se encontró ninguna formula asociada a ese numero ID proporcionado.`,
        });

      }
    }, error => {
      Swal.fire({
        icon: 'error',
        title: `Error`,
        text: `Ocurrió un error al buscar la formula. Intente nuevamente más tarde.`,
      });

    });


  }



  convertirAMayusculasCieP(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.facturaForm.get('cieP')?.setValue(input.value, { emitEvent: false });
  }

  convertirAMayusculasCieR1(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.facturaForm.get('cieR1')?.setValue(input.value, { emitEvent: false });
  }
  convertirAMayusculasCieR2(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.facturaForm.get('cieR2')?.setValue(input.value, { emitEvent: false });
  }

  convertirAMayusculasCieR3(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.facturaForm.get('cieR3')?.setValue(input.value, { emitEvent: false });
  }



  habilitarControles(): void {
    this.facturaForm.get('observacion')?.enable();
    this.facturaForm.get('ips')?.enable();
    this.facturaForm.get('medico')?.enable();
    this.facturaForm.get('fecPrescribe')?.enable();
    this.facturaForm.get('medicamento')?.enable();
    this.facturaForm.get('cieP')?.enable();
    this.facturaForm.get('cieR1')?.enable();
    this.facturaForm.get('cieR2')?.enable();
    this.facturaForm.get('cieR3')?.enable();
    this.facturaForm.get('cobroCM')?.enable();
    this.facturaForm.get('programa')?.enable();
    this.facturaForm.get('origenurgencia')?.enable();
    this.facturaForm.get('pgp')?.enable();
    this.facturaForm.get('fecSolicitud')?.enable();
  }

  deshabilitarControles(): void {
    this.facturaForm.get('observacion')?.disable();
    this.facturaForm.get('ips')?.disable();
    this.facturaForm.get('medico')?.disable();
    this.facturaForm.get('fecPrescribe')?.disable();
    this.facturaForm.get('medicamento')?.disable();
    this.facturaForm.get('cieP')?.disable();
    this.facturaForm.get('cieR1')?.disable();
    this.facturaForm.get('cieR2')?.disable();
    this.facturaForm.get('cieR3')?.disable();
    this.facturaForm.get('cobroCM')?.disable();
    this.facturaForm.get('programa')?.disable();
    this.facturaForm.get('origenurgencia')?.disable();
    this.facturaForm.get('pgp')?.disable();
    this.facturaForm.get('fecSolicitud')?.disable();
  }


  mostrarMedicamento(producto?: MedicamentoI): string {
    return producto ? producto.nombre.toString() : '';
  }

  seleccionarMedicamento(event: MatAutocompleteSelectedEvent): void {
    let medicamento = event.option.value;
    let bodega = parseInt(sessionStorage.getItem("bodega") || "0", 10);
    // Verifica que tanto el medicamento como el paciente estén definidos
    if (!medicamento || !this.pacienteActual) {
      console.error('Medicamento o paciente no definido.');
      return;
    }
    this.medicamentoEntegadoMenos30Dias(medicamento.idMedicamento, this.pacienteActual.idPaciente);
    if (this.existeItem(medicamento.idMedicamento)) {
      this.incrementaCantidad(medicamento.idMedicamento);
    } else {

      let nuevoItem = new ItemFormulaI();
      nuevoItem.medicamento = medicamento;
      nuevoItem.importe = nuevoItem.calcularImporte();

      // Habilitar cantidad según el idForma del medicamento

      nuevoItem.habilitarCantidad = this.formasConCantidadHabilitada.includes(medicamento.forma.idForma);

      this.formula.items = this.formula.items || [];  // Asegúrate de que items esté inicializado
      this.formula.items.push(nuevoItem);
      this.existenciaAcutal(medicamento.idMedicamento, bodega);

      if (medicamento.desabastecido || medicamento.agotado) {
        Swal.fire({
          icon: 'warning',
          title: 'MEDICAMENTO CON CARTA DE AGOTADO Y/O DESABASTECIDO',
          text: 'Por favor si tienes en existencia en tu bodega agregalo a la formula, de lo contrario notificale al paciente! recuerde si no tiene en existencia no lo agregue a la formula.',
        });
      }
    }

    // Resetea el campo medicamento y limpia la selección del autocompletar
    this.facturaForm.get('medicamento')?.reset();
  }

  existenciaAcutal(idMedicamento: number, idBodega: number) {
    this.medicamentoService.getMedicamentoBodega(idMedicamento, idBodega).subscribe(
      (existencia: any) => {
        this.existencias[idMedicamento] = existencia.cantidad;
      },
      (error: any) => {
        console.error('Error fetching existencia:', error);
      }
    );
  }

  actualizarCantidad(id: number, event: any): void {
    let cantidad: number = event.target.value as number;
    if (cantidad == 0) {
      return this.eliminarItemFormula(id);
    }
    this.formula.items = this.formula.items.map((item: ItemFormulaI) => {
      if (id === item.medicamento.idMedicamento) {
        item.cantidad = cantidad;
        item.importe = item.cantidad * item.medicamento.valor;
        this.formula.total = 0//this.formula.calcularGranTotal();


      }
      return item;
    });
  }


  duracionTratamiento(id: number, event: any): void {
    let duracion: number = event.target.value as number;
    this.formula.items = this.formula.items.map((item: ItemFormulaI) => {
      if (id === item.medicamento.idMedicamento) {
        item.duracion = duracion.toString();
        if (item.habilitarCantidad) {
          this.calcularCantidad(item);
        } // Recalcular la cant   
        item.importe = item.cantidad * item.medicamento.valor;
        this.formula.total = 0;//this.formula.calcularGranTotal();         
      }
      return item;
    });
  }

  calcularCantidad(item: any): void {
    const frecuenciaSeleccionada = this.frecuencias.find(f => f.valor === item.frecuencia);
    const factorMultiplicador = frecuenciaSeleccionada ? frecuenciaSeleccionada.multiplicador : 1;
    item.cantidad = factorMultiplicador * item.duracion;
  }

  seleccionFrecuencia(id: number, event: any): void {
    let frecuencia: string = event.target.value;
    this.formula.items = this.formula.items.map((item: ItemFormulaI) => {
      if (id === item.medicamento.idMedicamento) {
        item.frecuencia = frecuencia;
        if (item.habilitarCantidad) {
          this.calcularCantidad(item);
        } // Recalcular la cant
        item.importe = item.cantidad * item.medicamento.valor;
        this.formula.total = 0;//this.formula.calcularGranTotal();
      }
      return item;
    });
  }

  existeItem(id: number): boolean {
    let existe = false;
    this.formula.items.forEach((item: ItemFormulaI) => {
      if (id === item.medicamento.idMedicamento) {
        existe = true;
      }
    });
    return existe;
  }


  incrementaCantidad(id: number): void {
    this.formula.items = this.formula.items.map((item: ItemFormulaI) => {
      if (id === item.medicamento.idMedicamento) {
        ++item.cantidad;
        item.importe = item.cantidad * item.medicamento.valor;
        this.formula.total = 0;//this.formula.calcularGranTotal();
      }
      return item;
    });
  }

  eliminarItemFormula(idItem: number): void {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `Esta seguro de quitar el medicamento de la formula, ya no hara parte de la formulacion del paciente en esta formula!`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.formulaService.deleteItemFormula(this.formula.idBodega, idItem, this.formula.estado).subscribe(resp => {
          this.formula.items = this.formula.items.filter((item: ItemFormulaI) => idItem !== item.idItem);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El medicamento se ha quitado de la lista de la formula y de la tabla en la base de datos correctamente!.`,
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


  medicamentoEntegadoMenos30Dias(idMedicamento: number, idPaciente: number) {
    this.formulaService.getMedicamentoEntregadoPacienteMenosDe30Dias(idMedicamento, idPaciente).subscribe(
      (response: any) => {
        if (response && response.length > 0 && response[0].medicamento) {
          Swal.fire({
            icon: 'warning',
            title: 'Entregado menos de 30 días',
            text: `El medicamento ${response[0].medicamento.nombre} que está intentando dispensar, tiene un registro de entrega en menos de 30 días a este paciente. Por favor, verificar.`,
          });
        } else {
          console.log('No se encontraron registros recientes de entrega para este medicamento.');
        }
      },
      (error: any) => {
        console.error('Error en la consulta de la base de datos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al verificar el historial de entregas del medicamento. Por favor, inténtelo nuevamente más tarde.',
        });
      }
    );
  }

  actualizarFormula(): void {
    if (this.facturaForm.valid) {
      if (this.formula.items.length == 0) {
        this.facturaForm.get('medicamento')?.setErrors({ invalid: true });
      } else if (this.formula.items.length > 0) {
        if (!this.validateItems()) {
          // Detener el flujo de ejecución si hay un error
          return;
        }
        let mensaje = `Con estos items y cantidades <br>`;
        for (let i = 0; i < this.formula.items.length; i++) {
          mensaje +=
            i + 1 + ` - ${this.formula.items[i].medicamento.nombre} - Cantidad - ${this.formula.items[i].cantidad}<br>`;
        }

        Swal.fire({
          title: 'Confirma editar la formula?',
          icon: 'question',
          html: mensaje,
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Confirmar!',
        }).then((result) => {
          if (result.isConfirmed) {
            this.editFormula();
          }
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Verificar!',
          text: 'No se ha agregado ningún medicamento a la formula que intenta actualizar!',
        });
      }

    } else {
      Swal.fire({
        icon: 'warning',
        title: '!Alerta',
        text: 'Datos incompletos para actualizar la formula en la base de datos!',
      });
    }
  }

  public editFormula() {
    const funcionario = sessionStorage.getItem("nombre") || '';
    this.formula.ips = this.facturaForm.get('ips')?.value;
    this.formula.medico = this.facturaForm.get('medico')?.value;
    this.formula.nroFormula = this.facturaForm.get('nroFormula')?.value;
    this.formula.fecPrescribe = this.facturaForm.get('fecPrescribe')?.value;
    this.formula.funcionarioEditformula = funcionario;
    this.formula.fechaEditformula = new Date(); // Asignar fecha actual

    // actualizar los datos de EPS si hubo cambio de paciente
    if( this.pacienteActual?.idPaciente === this.pacienteNuevo?.idPaciente){
    this.formula.codEps=this.pacienteNuevo.eps.codigo;
    this.formula.regimen= this.pacienteNuevo.regimen;
    this.formula.categoria= this.pacienteNuevo.categoria.codigo;
    }

    this.formula.observacion = this.facturaForm.get('observacion')?.value;
    this.formula.cobroCM = this.facturaForm.get('cobroCM')?.value;
    this.formula.valorCM = (this.formula.cobroCM ? this.pacienteActual.categoria.valor : 0); //this.facturaForm.get('valorCM')?.value;
    this.formula.cieP = this.facturaForm.get('cieP')?.value;
    this.formula.cieR1 = this.facturaForm.get('cieR1')?.value;
    this.formula.cieR2 = this.facturaForm.get('cieR2')?.value;
    this.formula.origenurgencia = this.facturaForm.get('origenurgencia')?.value;
    this.formula.pgp = this.facturaForm.get('pgp')?.value;
    this.formula.programa = this.facturaForm.get('programa')?.value;
    this.formula.total = 0//this.formula.calcularGranTotal();


    //this.formula.funcionarioeditaformula = funcionario!;
    const formulaEditada = this.formula; // Crear una copia para no modificar el original
    formulaEditada.items = formulaEditada.items.map((item: any) => ({
      ...item,
      itemsEntrega: [], // Anular entregas
    }));

    this.formulaService.update(formulaEditada).subscribe(resp => {
      Swal.fire({
        icon: 'success',
        title: `Ok`,
        text: `La formula ha sido actualizado correctamente!`,
      }).then(() => {
    if (!this.tieneAcceso(4)) {
      this.router.navigate(['/menu/formula', this.formula.paciente.idPaciente]);
    }
  });

    },
      err => {
        Swal.fire({
          icon: 'error',
          title: 'Error...',
          text: 'No se pudo guardar la formula en la base de datos!',
          footer: err.mensaje
        }).then(() => {
    if (!this.tieneAcceso(4)) {
      this.router.navigate(['/menu/formula', this.formula.paciente.idPaciente]);
    }
  });
      }
    );

  }



  ocultarComentario() {
    this.comentarioVisible = false;
  }

  actualizarComentario(event: Event) {
    const input = event.target as HTMLInputElement;
    // Obtener el valor del input
    const valorInput = input.value;
    this.mensajeErrorDx = "";
    // Verificar si el valor del input tiene 4 caracteres
    if (valorInput.length === 4) {
      this.formulaService.getDxFormula(valorInput).subscribe(
        reg => {
          if (reg) {
            this.dxValido = false;
            this.mensajeComentario = reg.nombre;
            if (reg.sexo != 'A' && reg.sexo != this.pacienteActual.sexo) {
              this.mensajeErrorDx = "Error de diagnóstico diligenciado, no corresponde con el sexo del paciente por favor verificar!"
              this.dxValido = true;
            }
          } else {
            this.mensajeComentario = 'El diagnóstico no se encontró en la tabla CIE10.';
            this.dxValido = true;
          }
        },
        error => {
          this.mensajeComentario = 'Error al obtener el diagnóstico.';
        }
      );
    } else {
      this.mensajeComentario = 'El código debe tener 4 caracteres.';
      this.dxValido = true;
    }
    this.comentarioVisible = true;
  }


  calcularEdad(fn: Date): string {
    if (fn !== null && fn !== undefined) {
      const convertAge = new Date(fn);
      const timeDiff = Math.abs(Date.now() - convertAge.getTime());
      let edad = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);
      if (edad) {
        return edad.toString();
      }
    }
    return '-';

  }

  validateItems() {
    const hasInvalidDuration = this.formula.items.some(item => Number(item.duracion) === 0);
    if (hasInvalidDuration) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La duración de tratamiento del medicamento y/o insumo no puede ser cero (0), por favor corregirlo y continuar.',
      });
      return false; // Retorna false si hay un error
    }
    return true; // Retorna true si todo está correcto
  }

  ValidaPaciente() {
    if (this.pacienteActual.estado === true) {
      if (this.pacienteActual.dispensario === "SISM DISPENSARIO") {
        this.facturaForm.get('cobroCM')?.setValue(this.cobroCuotaModeradora());
        const municipioPaciente = this.pacienteActual.municipio.codigo;
        const municipioPortabilidad = this.pacienteActual.mpoportabilidad?.codigo;
        const fechaVencimientoPortabilidad = new Date(this.pacienteActual?.fecVencePortabilidad);
        const fechaActual = new Date(this.fechaActual);

        if (this.bodegaActual.municipio === municipioPaciente ||
          (this.pacienteActual.portabilidad &&
            this.bodegaActual.municipio === municipioPortabilidad &&
            fechaVencimientoPortabilidad >= fechaActual)) {
          this.habilitarControles();
          this.facturaForm.updateValueAndValidity(); // Asegura que el formulario esté actualizado
        } else {
          Swal.fire({
            icon: 'warning',
            title: `OTRO MUNICIPIO`,
            text: `El paciente está en otro municipio o portabilidad vencida.`,
          });
        }
      } else {
        Swal.fire({
          icon: 'warning',
          title: `OTRO DISPENSARIO`,
          text: `El paciente pertenece a otro dispensario.`,
        });
      }
    } else {
      Swal.fire({
        icon: 'info',
        title: `INACTIVO`,
        text: `El paciente está inactivo. No se puede generar la entrega de medicamentos.`,
      });
    }



    if (!this.bodegaActual.dispensa) {
      Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: `La bodega ${this.bodegaActual.nombre} donde está logueado el funcionario no está habilitada para dispensar fórmulas a pacientes.`,
      });
    }

  }


  cancelarEdicion() {
    this.editarPaciente = false;
    this.facturaForm.get('numDocumento')?.reset();
  }

  enEdicion() {
    this.editarPaciente = true;
  }

  cambiarPaciente() {
    this.pacienteNuevo = null;
    const documento = this.facturaForm.get('numDocumento')?.value;
    if (!documento) {
      Swal.fire(
        'Campo vacío',
        'Debe ingresar un número del documento del paciente a quien le pertenece la fórmula.',
        'warning'
      );
      return;
    }
    this.pacienteService.getRegistroDocumento(documento).subscribe((clientes) => {
      if (!clientes || clientes.length === 0) {
        Swal.fire('No encontrado', 'No se encontró ningún paciente con ese documento.', 'info');
        return;
      }

      if (clientes.length > 1) {
        Swal.fire({
          icon: 'error',
          title: 'DOCUMENTO DUPLICADO',
          text: 'Este documento está duplicado en la base de datos. Identifique claramente al paciente para hacer el cambio.',
        });
        return;
      }

      this.pacienteNuevo = clientes[0];

      Swal.fire({
        title: '¿Desea cambiar?',
        html: `
        <p style="margin:2px 0;"><strong>Paciente anterior:</strong> 
          ${this.pacienteActual.pNombre || ''} ${this.pacienteActual.sNombre || ''} 
          ${this.pacienteActual.pApellido || ''} ${this.pacienteActual.sApellido || ''}
        </p>
        <p style="margin:2px 0;"><strong>Paciente nuevo:</strong> 
          ${this.pacienteNuevo.pNombre || ''} ${this.pacienteNuevo.sNombre || ''} 
          ${this.pacienteNuevo.pApellido || ''} ${this.pacienteNuevo.sApellido || ''}
        </p>
      `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Cambiar!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.formula.paciente = this.pacienteNuevo;
          this.pacienteActual = this.pacienteNuevo;
          this.editarPaciente = false;

          // Limpiar input del documento
          this.facturaForm.get('numDocumento')?.reset();

          // Mostrar mensaje de éxito
          Swal.fire({
            icon: 'success',
            title: 'Paciente actualizado',
            text: `El paciente ha sido cambiado exitosamente, recuerde actualizar la formula para que el cambio persista en base de datos`,

          });
        }
      });
    });
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
