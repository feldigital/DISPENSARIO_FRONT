import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormulaI } from 'src/app/modelos/formula.model';
import { PacienteService } from 'src/app/servicios/paciente.service';
import { ActivatedRoute, Router } from '@angular/router';
import { from } from 'rxjs';
import { map, debounceTime, switchMap, concatMap, finalize } from 'rxjs/operators';
import { FormulaService } from 'src/app/servicios/formula.service';
import { MedicamentoI } from 'src/app/modelos/medicamento.model';
import { ItemFormulaI } from 'src/app/modelos/itemformula.model';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MedicamentoService } from 'src/app/servicios/medicamento.service';
import { MedicoService } from 'src/app/servicios/medico.service';
import { IpsService } from 'src/app/servicios/ips.service';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { MatDialog } from '@angular/material/dialog';
import { IpsComponent } from '../ips/ips.component';
import { MedicosComponent } from '../medicos/medicos.component';
import { HistorialformulaComponent } from '../historialformula/historialformula.component';


@Component({
  selector: 'app-formula',
  templateUrl: './formula.component.html',
  styleUrls: ['./formula.component.css']
})
export class FormulaComponent implements OnInit {
  @ViewChild(HistorialformulaComponent) historialFormulaComponente!: HistorialformulaComponent;


  formula: FormulaI = new FormulaI();
  facturaForm!: FormGroup;
  listaMedicamento: any;
  pacienteActual: any;
  bodegaActual: any;
  mostrarComponente: Boolean = false;
  existencias: { [key: number]: number } = {};
  hoy!: string;
  comentarioVisible: boolean = false;
  mensajeComentario: string = '';
  mensajeErrorDx: string = '';
  fechaActual!: Date;
  //@Output() formulaAgregada = new EventEmitter<void>();  

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
    { nombre: '2 Despues de cada comida', multiplicador: 6, valor: '2 Despues de cada comida' },
    { nombre: '2 Cada 15 dias', multiplicador: 4, valor: '2 Cada 15 dias' },
    { nombre: '2 Cada Mes', multiplicador: 2, valor: '2 Cada Mes' },
    { nombre: '2 Cada Trimestre', multiplicador: 2, valor: '2 Cada Trimestre' },
    { nombre: 'Dosis unica', multiplicador: 1, valor: 'Dosis unica' }

  ];


  medicamentosFiltrados: any[] = [];
  medicosFiltrados: any[] = [];
  ipsFiltrados: any[] = [];

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
      fecSolicitud: [new Date(), Validators.required],
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
      valorCM: ['0'],
      checkcontinuidad: [false],
      cantidadmeses: [''],
      posfechados: this.formBuilder.array([]),
    });
  }

  ngOnInit() {
    this.deshabilitarControles();
    this.activatedRoute.paramMap.subscribe(params => {
      let pacienteId = +params.get('id')!;
      let formulaId = +params.get('idFormula')!;

      if (pacienteId) {
        // Procesar el paciente
        this.pacienteService.getRegistroId(pacienteId).subscribe(cliente => {
          this.formula.paciente = cliente;
          this.facturaForm.get('paciente')?.setValue(this.formula.paciente.numDocumento);
          this.mostrarComponente = true;
          this.pacienteActual = cliente;
          this.habilitarControles();
          this.facturaForm.get('cobroCM')?.setValue(this.cobroCuotaModeradora());
        });

      } else if (formulaId) {
        // Procesar la formula formulaService
        this.formulaService.getFormulaId(formulaId).subscribe(reg => {
          this.formula = reg;
          this.mostrarComponente = true;
          this.pacienteActual = reg.paciente;
          this.mostrarRegistro(reg);
          this.facturaForm.get('cobroCM')?.setValue(this.cobroCuotaModeradora());
        });


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
        switchMap(query => this.formulaService.filtrarMedicamentos(query))
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
    this.setPosfechados();
    this.fechaActual = new Date();
    this.hoy = this.fechaActual.toISOString().split('T')[0];  // Formato YYYY-MM-DD
  }

  get posfechados(): FormArray {
    return this.facturaForm.get('posfechados') as FormArray;
  }

  setPosfechados() {
    const control = this.posfechados;
    // Vacía el FormArray antes de agregar nuevos controles
    while (control.length !== 0) {
      control.removeAt(0);
    }
    // Agrega un nuevo control por cada ítem en formula.items
    this.formula.items.forEach(() => control.push(this.formBuilder.control(false)));
  }

  isPosfechadosSelected(index: number): boolean {
    return this.posfechados.at(index).value;
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

  public buscarDocumento() {
    this.deshabilitarControles()
    this.pacienteService.getRegistroDocumento(this.facturaForm.get('paciente')!.value).subscribe(cliente => {
      this.formula.paciente = cliente;      
      this.pacienteActual = cliente;
      this.mostrarComponente = true;
      this.historialFormulaComponente.buscarRegistro(this.pacienteActual.idPaciente);
      this.formula.items = [];

      if (this.pacienteActual.estado === true) {

        if (this.pacienteActual.dispensario === "SISM DISPENSARIO") {
          this.facturaForm.get('cobroCM')?.setValue(this.cobroCuotaModeradora());

          const municipioPaciente = this.pacienteActual.municipio.codigo;
          const municipioPortabilidad = this.pacienteActual.mpoportabilidad?.codigo;
          // Convertir las fechas a objetos Date si no lo son
         const fechaVencimientoPortabilidad = new Date(this.pacienteActual?.fecVencePortabilidad);
         const fechaActual = new Date(this.fechaActual);
          
          // Si el municipio de la bodega coincide con el municipio del paciente
          if (this.bodegaActual.municipio === municipioPaciente) {
            this.habilitarControles();
          } 
          // Si el paciente está en portabilidad
          else if (this.pacienteActual.portabilidad) {
            // Si el municipio de la bodega coincide con el de la portabilidad
            if (this.bodegaActual.municipio === municipioPortabilidad) {
              // Si la portabilidad no está vencida
              if (fechaVencimientoPortabilidad >= fechaActual) {
                this.habilitarControles();
              } else {
                Swal.fire({
                  icon: 'warning',
                  title: `OTRO MUNICIPIO`,
                  text: `El paciente del municipio ${this.pacienteActual.municipio.nombre} - ${this.pacienteActual.municipio.departamento.nombre} está en portabilidad vencida`,
                });
              }
            } 
            // Si el municipio de la bodega no coincide con la portabilidad
            else {
              Swal.fire({
                icon: 'warning',
                title: `OTRO MUNICIPIO`,
                text: `El paciente es del municipio de ${this.pacienteActual.municipio.nombre} - ${this.pacienteActual.municipio.departamento.nombre}, está en portabilidad, para el municipio de ${this.pacienteActual.mpoportabilidad.nombre} - ${this.pacienteActual.mpoportabilidad.departamento.nombre}`,
              });
            }
          } 
          // Si el paciente no está en portabilidad
          else {
            Swal.fire({
              icon: 'warning',
              title: `OTRO MUNICIPIO`,
              text: `El paciente es del municipio de ${this.pacienteActual.municipio.nombre} - ${this.pacienteActual.municipio.departamento.nombre} y no está en portabilidad`,
            });
          }

          } else {
            Swal.fire({
              icon: 'warning',
              title: `OTRO DISPENSARIO`,
              text: `El paciente que le va a entregar medicamento le pertenece al dispensario ` + this.pacienteActual.dispensario + ", no esta autorizado para la entrega!",
            });

          }
        }
        else {
          Swal.fire({
            icon: 'info',
            title: `INACTIVO`,
            text: 'El paciente ' + this.pacienteActual.pNombre + ' ' + this.pacienteActual.sNombre + ' ' + this.pacienteActual.pApellido + ' ' + this.pacienteActual.sApellido + ' se encuentra inactivo en la base de Datos!',
          });
        }

      }, error => {
        Swal.fire({
          icon: 'info',
          title: `Información`,
          text: `No se encontró ningún paciente para el documento de búsqueda proporcionado.!`,
        });
        this.mostrarComponente = false;
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

    })
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
  }


  mostrarMedicamento(producto?: MedicamentoI): string {
    return producto ? producto.nombre.toString() : '';
  }
/*
  seleccionarMedicamento(event: MatAutocompleteSelectedEvent): void {
    let medicamento = event.option.value; //as MedicamentoI;
    let bodegaString = sessionStorage.getItem("bodega");
    let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
    this.medicamentoEntegadoMenos30Dias(medicamento.idMedicamento, this.pacienteActual.idPaciente);
    if (this.existeItem(medicamento.idMedicamento)) {
      this.incrementaCantidad(medicamento.idMedicamento);
    } else {
      let nuevoItem = new ItemFormulaI();
      nuevoItem.medicamento = medicamento;
      console.log(medicamento);
      nuevoItem.importe = nuevoItem.calcularImporte();
      if (medicamento.forma.idForma === 3 || medicamento.forma.idForma === 15 || medicamento.forma.idForma === 19 || medicamento.forma.idForma === 20
        || medicamento.forma.idForma === 22 || medicamento.forma.idForma === 24 || medicamento.forma.idForma === 116
      )
        nuevoItem.habilitarCantidad = true;
      else
        nuevoItem.habilitarCantidad = false;

      this.formula.items.push(nuevoItem);
      this.setPosfechados();
      this.existenciaAcutal(medicamento.idMedicamento, bodega);
    }
    this.facturaForm.get('medicamento')?.setValue('');
    event.option.focus();
    event.option.deselect();
  }*/

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
        console.log(medicamento);
        nuevoItem.importe = nuevoItem.calcularImporte();
    
        // Habilitar cantidad según el idForma del medicamento
        const formasConCantidadHabilitada = [3, 15, 19, 20, 22, 24, 116];
        nuevoItem.habilitarCantidad = formasConCantidadHabilitada.includes(medicamento.forma.idForma);
    
        this.formula.items = this.formula.items || [];  // Asegúrate de que items esté inicializado
        this.formula.items.push(nuevoItem);
        this.setPosfechados();
        this.existenciaAcutal(medicamento.idMedicamento, bodega);
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
        item.importe = item.calcularImporte();
      }
      return item;
    });
  }


  duracionTratamiento(id: number, event: any): void {
    let duracion: number = event.target.value as number;
    this.formula.items = this.formula.items.map((item: ItemFormulaI) => {
      if (id === item.medicamento.idMedicamento) {
        item.duracion = duracion.toString();
        if (item.habilitarCantidad)
          this.calcularCantidad(item); // Recalcular la cant
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
        if (item.habilitarCantidad)
          this.calcularCantidad(item); // Recalcular la cant
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
        item.importe = item.calcularImporte();
      }
      return item;
    });
  }

  eliminarItemFormula(id: number): void {
    this.formula.items = this.formula.items.filter((item: ItemFormulaI) => id !== item.medicamento.idMedicamento);
    this.setPosfechados();
  }
/*
  medicamentoEntegadoMenos30Dias(idMedicamento: number, idPaciente: number) {
    this.formulaService.getMedicamentoEntregadoPacienteMenosDe30Dias(idMedicamento, idPaciente).subscribe(
      (item: any) => {
        Swal.fire({
          icon: 'warning',
          title: `Entregado menos de 30 dias`,
          text: `El medicamento ` + item[0].medicamento.nombre + ' que esta intentando dispensar, tiene un registro de entrega en menos de 30 dias a este paciente, por favor verificar!',
        });
      },
      (error: any) => {
        console.error('Error en la consulta de la base de datos:', error);
      }
    );
  }*/

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
    } // <- Aquí está la llave de cierre que faltaba.

  create(): void {
    if (this.facturaForm.valid) {
      if (this.formula.items.length == 0) {
        this.facturaForm.get('medicamento')?.setErrors({ 'invalid': true });
      }
      if (this.formula.items.length > 0) {

        if (this.facturaForm.get('checkcontinuidad')!.value) {
          if (this.facturaForm.get('cantidadmeses')!.value > 1) {
            let control = false;
            for (let i = 0; i < this.formula.items.length; i++) {
              if (this.posfechados.at(i).value) control = true;
            }

            if (control) {

              let mensaje = `Con estos items y cantidades <br>`;
              for (let i = 0; i < this.formula.items.length; i++) {
                mensaje += (i + 1) + ` - ${this.formula.items[i].medicamento.nombre} - Cantidad - ${this.formula.items[i].cantidad}<br>`;
              }
              Swal.fire({
                title: 'Confirma agregar la formula?',
                icon: 'question',
                html: mensaje,
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Confirmar!'
              }).then((result) => {
                if (result.isConfirmed) {

                  this.agregarFormula(this.facturaForm.get('cantidadmeses')!.value);

                  Swal.fire({
                    icon: 'success',
                    title: `Ok`,
                    text: `La formula ha sido agregada correctamente!`,
                  });

                  this.facturaForm.reset();
                  this.facturaForm.get('paciente')?.setValue(this.pacienteActual.numDocumento);
                  //const currentFormulas = this.formulasSubject.value;
                  //this.formulasSubject.next([...currentFormulas, this.formula]);

                }
              });

            }
            else {
              Swal.fire({
                icon: 'error',
                title: 'Verificar!',
                text: 'No ha seleccionado ningún medicamento para pos fechar en la formula!',
              });
            }

          }
          else {
            Swal.fire({
              icon: 'error',
              title: 'Verificar!',
              text: 'El número de meses a pos fechar la formula debe ser mayor que 1 para poderlas generar!',
            });
          }
        }
        else {
          let mensaje = `Con estos items y cantidades <br>`;
          for (let i = 0; i < this.formula.items.length; i++) {
            mensaje += (i + 1) + ` - ${this.formula.items[i].medicamento.nombre} - Cantidad - ${this.formula.items[i].cantidad}<br>`;
          }
          Swal.fire({
            title: 'Confirma agregar la formula?',
            icon: 'question',
            html: mensaje,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Confirmar!'
          }).then((result) => {
            if (result.isConfirmed) {
              this.agregarFormula(1);
              Swal.fire({
                icon: 'success',
                title: `Ok`,
                text: `La formula ha sido agregada correctamente!`,
              });
              this.facturaForm.reset();
              this.facturaForm.get('paciente')?.setValue(this.pacienteActual.numDocumento);
            }
          });
        }
      }
      else {
        Swal.fire({
          icon: 'warning',
          title: 'Verificar!',
          text: 'No se ha agregado ningún medicamento a la formula que intenta guardar!',
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: 'Datos incompletos para crear la formula en la base de datos!'
      });
    }
  }

  public agregarFormula(cuantas: number) {
    let bodegaString = sessionStorage.getItem("bodega");
    let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
    this.formula.idBodega = bodega;
    this.formula.ips = this.facturaForm.get('ips')?.value;
    this.formula.medico = this.facturaForm.get('medico')?.value;
    this.formula.nroFormula = this.facturaForm.get('nroFormula')?.value;
    this.formula.fecPrescribe = this.facturaForm.get('fecPrescribe')?.value;
    this.formula.observacion = this.facturaForm.get('observacion')?.value;
    this.formula.cobroCM = this.facturaForm.get('cobroCM')?.value;
    this.formula.valorCM = (this.formula.cobroCM ? this.pacienteActual.categoria.valor : 0); //this.facturaForm.get('valorCM')?.value;
    this.formula.cieP = this.facturaForm.get('cieP')?.value;
    this.formula.cieR1 = this.facturaForm.get('cieR1')?.value;
    this.formula.cieR2 = this.facturaForm.get('cieR2')?.value;
    this.formula.origenurgencia = this.facturaForm.get('origenurgencia')?.value;
    this.formula.programa = this.facturaForm.get('programa')?.value;
    this.formula.total = this.formula.calcularGranTotal();
    let obs = this.facturaForm.get('observacion')?.value;
    if (cuantas === 1) {
      this.formula.continuidad = "1 de 1";
      console.log(this.formula);
      this.formulaService.create(this.formula).subscribe(resp => {
        this.historialFormulaComponente.buscarRegistro(this.pacienteActual.idPaciente);
        this.formula.items = [];
      },
        err => {
          Swal.fire({
            icon: 'error',
            title: 'Error...',
            text: 'No se pudo guardar la formula en la base de datos!',
            footer: err.mensaje
          });
        }
      );
    }
    else {
      const formulas: FormulaI[] = [];
      this.formula.continuidad = "1 de " + cuantas;
      this.formula.observacion = obs + "- Formula post-fechada " + 1 + " de " + cuantas;
      formulas.push(this.formula);

      const currentDate = new Date();
      // const nuevaDatePosfechada = new Date(currentDate);
      for (let j = 1; j < cuantas; j++) {
        let formulaNueva = new FormulaI();
        const nuevaDatePosfechada = new Date(currentDate);
        nuevaDatePosfechada.setDate(currentDate.getDate() + (30 * j));
        formulaNueva.paciente = this.pacienteActual;
        formulaNueva.ips = this.formula.ips;
        formulaNueva.medico = this.formula.medico;
        formulaNueva.nroFormula = this.formula.nroFormula;
        formulaNueva.fecPrescribe = nuevaDatePosfechada;
        formulaNueva.fecSolicitud = null;
        formulaNueva.observacion = obs + "- Formula post-fechada " + (j + 1) + " de " + cuantas;
        formulaNueva.cobroCM = false;
        formulaNueva.valorCM = 0;
        formulaNueva.cieP = this.formula.cieP;
        formulaNueva.cieR1 = this.formula.cieR1;
        formulaNueva.cieR2 = this.formula.cieR2;
        formulaNueva.origenurgencia = this.formula.origenurgencia;
        formulaNueva.programa = this.formula.programa;
        formulaNueva.continuidad = (j + 1) + " de " + cuantas;
        formulaNueva.idBodega = bodega;

        for (let i = 0; i < this.formula.items.length; i++) {
          if (this.posfechados.at(i).value) {
            let nuevoItem = new ItemFormulaI();
            nuevoItem.medicamento = this.formula.items[i].medicamento;
            nuevoItem.cantidad = this.formula.items[i].cantidad;
            nuevoItem.frecuencia = this.formula.items[i].frecuencia;
            nuevoItem.duracion = this.formula.items[i].duracion;
            nuevoItem.importe = nuevoItem.calcularImporte();
            formulaNueva.items.push(nuevoItem);
          }
        } //fin del for interno
        formulaNueva.total = formulaNueva.calcularGranTotal();
        formulas.push(formulaNueva);
      } //fin del for
      // Usar `from` para convertir el array de fórmulas a un observable
      from(formulas).pipe(
        concatMap(formula => this.formulaService.create(formula)),
        finalize(() => {
          // Llamar a la función para listar las fórmulas después de completar todas las solicitudes
          this.historialFormulaComponente.buscarRegistro(this.pacienteActual.idPaciente);
          this.formula.items = [];
        })
      ).subscribe(
        resp => {
          console.log(resp)
          // this.formulaAgregada.emit();
        },
        err => {
          Swal.fire({
            icon: 'error',
            title: 'Error...',
            text: 'No se pudo guardar la formula en la base de datos!',
            footer: err.mensaje
          });
        }
      );
    }
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
            this.mensajeComentario = reg.nombre;
            if (reg.sexo != 'A' && reg.sexo != this.pacienteActual.sexo) {
              this.mensajeErrorDx = "Error de diagnóstico diligenciado, no corresponde con el sexo del paciente por favor verificar!"

            }


          } else {
            this.mensajeComentario = 'El diagnóstico no se encontró.';
          }
        },
        error => {
          this.mensajeComentario = 'Error al obtener el diagnóstico.';
        }
      );
    } else {
      this.mensajeComentario = 'El código debe tener 4 caracteres.';
    }
    this.comentarioVisible = true;
  }

}
