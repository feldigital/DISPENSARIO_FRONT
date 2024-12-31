import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicamentoI } from 'src/app/modelos/medicamento.model';
import { MedicamentoService } from 'src/app/servicios/medicamento.service';
import { FormaService } from 'src/app/servicios/forma.service';
import Swal from 'sweetalert2';
import { ViaService } from 'src/app/servicios/via.service';
import { Observable, debounceTime, of, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { FfarmaceuticaComponent } from '../ffarmaceutica/ffarmaceutica.component';
import { VadministracionComponent } from '../vadministracion/vadministracion.component';
import { PacienteService } from 'src/app/servicios/paciente.service';
import { EpsMedicamentoI } from 'src/app/modelos/epsMedicamento.model';
import { BodegaService } from 'src/app/servicios/bodega.service';

@Component({
  selector: 'app-medicamento',
  templateUrl: './medicamento.component.html',
  styleUrls: ['./medicamento.component.css']
})
export class MedicamentoComponent implements OnInit {
  generalForm!: FormGroup;
  nombrebtn!: string;
  listaregistros: any;
  banderaRegistro!: boolean;
  parametro: any;
  listFormas: any;
  listVias: any;
  listaregistrosFiltrados: MedicamentoI[] | any;
  listaEps:any;
  listaBodegas:any;
  


  constructor(
    private fb: FormBuilder,
    private servicio: MedicamentoService,
    private servicioPaciente: PacienteService,
    private servicioBodega: BodegaService,
    private formaservicio: FormaService,
    private viaservicio: ViaService,
    public dialog: MatDialog
  ) 
  {
    this.cargarRegistros();
    this.cargarFormas();
    this.cargarVias();
    this.nombrebtn = "Crear";
    this.banderaRegistro = true;
  }

  ngOnInit(): void {
    this.crearFormulario();

    this.generalForm.get('nombre')!.valueChanges
    .pipe(
      debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir
      switchMap(query => this.buscarMedicamentos(query))
    )
    .subscribe(results => {       
      this.listaregistrosFiltrados = results        
    });
  }

  buscarMedicamentos(filterValue: string): Observable<any[]> {
    if (filterValue && filterValue.length > 3) {
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
        this.listaregistrosFiltrados=resp;
     },
        (err: any) => { console.error(err) }
      );
  }

  cargarFormas() {
    this.listFormas = null;
    this.formaservicio.getRegistros()
      .subscribe((resp: any) => {
        this.listFormas = resp;       
      },
        (err: any) => { console.error(err) }
      );
  }

  cargarVias() {
    this.listVias = null;
    this.viaservicio.getRegistros()
      .subscribe((resp: any) => {
        this.listVias = resp;
      },
        (err: any) => { console.error(err) }
      );
  }

  /*FUNCION DE CREACION DEL FORMULARIO*/
  crearFormulario() {
    this.generalForm = this.fb.group
      ({
        idMedicamento: [''],
        nombre: ['', [Validators.required]],
        principioActivo: [''],
        codigoCum: [''],
        codigoAtc: [''],
        concentracion: [''],
        valor: ['', [Validators.required]],
        descuento: [''],
        codigoBarra: [''],
        fecCreacion: [''],
        via: ['', [Validators.required]],
        forma: ['', [Validators.required]],
        estado: [true, [Validators.required]],
        desabastecido: [false, [Validators.required]],
        agotado: [false, [Validators.required]],
        controlado: [false, [Validators.required]],
   //     listFilter:[''],
      

      });
  }



  mostrarRegistro(itemt: any) {
    this.nombrebtn = "Actualizar"
    this.generalForm.setValue({
      idMedicamento: itemt.idMedicamento,
      nombre: itemt.nombre,
      principioActivo: itemt.principioActivo,
      codigoCum: itemt.codigoCum,
      codigoAtc: itemt.codigoAtc,
      concentracion: itemt.concentracion,
      valor: itemt.valor,
      descuento: itemt.descuento,
      codigoBarra: itemt.codigoBarra,
      fecCreacion: itemt.fecCreacion,
      via: itemt.via.idVia,
      forma: itemt.forma.idForma,
      estado: itemt.estado,
      desabastecido: itemt.desabastecido,
      agotado: itemt.agotado,
      controlado: itemt.controlado,
     // listFilter: '',      
    })
  }


  
  openDialogVia(): void {
    const dialogRef = this.dialog.open(VadministracionComponent, {
      width: '400px',
      data: { /* puedes pasar datos iniciales aquí */ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Aquí puedes manejar los datos devueltos, por ejemplo, seleccionar la IPS recién creada
        this.cargarVias();
        this.generalForm.get('via')!.setValue(result.nombre);
      }
    });
  }

  
  openDialogForma(): void {
    const dialogRef = this.dialog.open(FfarmaceuticaComponent, {
      width: '400px',
      data: { /* puedes pasar datos iniciales aquí */ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {       
        // Aquí puedes manejar los datos devueltos, por ejemplo, seleccionar la IPS recién creada
        this.cargarFormas();
        this.generalForm.get('forma')!.setValue(result.nombre);
      }
    });
  }


  create() {
     if (this.generalForm.valid) {
      if (this.nombrebtn == "Crear") {
        this.servicio.create(this.generalForm.value).subscribe(ciclo => {
          this.cargarRegistros();
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El medicamento ha sido creado correctamente`,
          });
          this.generalForm.reset();
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo guardar el medicamento en la base de datos!',
              footer: err.mensaje //JSON.stringify(err)
            });
          }
        );
      }
      else {
        
        this.servicio.update(this.generalForm.value).subscribe(ciclo => {

          this.cargarRegistros();
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El medicamento ha sido actualizado correctameente`,
          });
          this.generalForm.reset();

        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo actualizar el medicamento en la base de datos!',
              footer: err.mensaje
            });
          });
      }
    } else {
       Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: 'Datos incompletos para crear el medicamento en la base de datos!'
      });
    }
  }


  eliminarRegistro(itemt: MedicamentoI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `El medicamento ` + itemt.nombre + ` de la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.delete(itemt.idMedicamento).subscribe(resp => {
          this.listaregistros = this.listaregistros.filter((cli: MedicamentoI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El medicamento ha sido eliminado correctamente.`,
          });
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: `Error`,
              text: err.error.mensaje,
            });
          });
      }
    });
  }

  public modificarContrato(itemt: any, tipo: number): void {
    const titulo = tipo === 0 
      ? 'Adicionando el medicamento al contrato' 
      : 'Quitando el medicamento del contrato';
  
    const confirmButtonText = tipo === 0 ? 'Adicionar' : 'Quitar';
  
    this.listadeEps().then((listadeEps) => {
      Swal.fire({
        title: titulo,
        html: `
          <div class="swal-container">           
            <div>${itemt.nombre}</div><br>
            <div class="form-group">      
              <select id="selectEps" class="form-select">
                <option value="-1">Seleccione la EPS</option>
                ${listadeEps}                    
              </select>   
            </div>         
          </div>  
        `,
        showCancelButton: true,
        confirmButtonText: confirmButtonText,
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          const selectElement = document.getElementById('selectEps') as HTMLSelectElement;
          const selectedValue = selectElement.value;
          
          if (selectedValue !== '-1') {
            let mensaje="";
            if (tipo === 0) {
              const epsMedicamento = new EpsMedicamentoI();
              epsMedicamento.idMedicamento = itemt.idMedicamento;
              epsMedicamento.codEps = selectedValue;
              mensaje=`Se realizó el trámite de adición del medicamento ${itemt.nombre} al contrato con la EPS ${selectedValue} con éxito!`;
              this.ejecutarAccion(() => this.servicio.adicionarMedicamento(epsMedicamento), mensaje);
            } else {
              mensaje=`Se realizó el trámite de eliminación del medicamento ${itemt.nombre} al contrato con la EPS ${selectedValue} con éxito!`;
              this.ejecutarAccion(() => this.servicio.quitarMedicamento(itemt.idMedicamento, selectedValue), mensaje);
            }
          } else {
            Swal.fire(
              'Falta!',
              `No has seleccionado la EPS para proceder con el tramite del medicamento ${itemt.nombre}`, 
              'warning'
            );
          }
        }
      });
    });
  }
  
  private async listadeEps(): Promise<string | undefined> {
    try {
      const resp: any = await this.servicioPaciente.getEps().toPromise();
      return resp.map((item: { codigo: any; nombre: any }) => 
        `<option value="${item.codigo}">${item.codigo} - ${item.nombre}</option>`
      ).join('');
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }
  
  private ejecutarAccion(accion: () => any, mensajet: string): void {
    accion().subscribe(
      () => {
        Swal.fire({
          icon: 'success',
          title: 'Ok',
          text: mensajet,
        });
      },
      (err: { error: { mensaje: string } }) => {
         Swal.fire({
          icon: 'error',
          title: 'Error...',
          text: 'No se pudo realizar el trámite con el medicamento!',
          footer: err.error.mensaje,
        });
      }
    );
  }

  public modificarMedicamentoBodega(itemt: any, tipo: number): void {
    const titulo = tipo === 0 
      ? 'Adicionando el medicamento a la bodega' 
      : 'Quitando el medicamento de la bodega';
  
    const confirmButtonText = tipo === 0 ? 'Adicionar' : 'Quitar';
  
    this.listadeBodegas().then((listadeBodegas) => {
      Swal.fire({
        title: titulo,
        html: `
          <div class="swal-container">           
            <div>${itemt.nombre}</div><br>
            <div class="form-group">      
              <select id="selectBodega" class="form-select">
                <option value="-1">Seleccione la bodega</option>
                ${listadeBodegas}                    
              </select>   
            </div>         
          </div>  
        `,
        showCancelButton: true,
        confirmButtonText: confirmButtonText,
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          const selectElement = document.getElementById('selectBodega') as HTMLSelectElement;
          const selectedValue = selectElement.value;
          
          if (selectedValue !== '-1') {
            let mensaje="";
            if (tipo === 0) {             
              mensaje=`Se realizó el trámite de adición del medicamento ${itemt.nombre} a la bodega   ${selectedValue} con éxito!`;
              this.ejecutarAccion(() => this.servicio.agregarMedicamentoUnaBodega(itemt.idMedicamento,+selectedValue), mensaje);
            } else {
              mensaje=`Se realizó el retiro del medicamento ${itemt.nombre} en la bodega con éxito!`;
              this.ejecutarAccion(() => this.servicio.quitarMedicamento(itemt.idMedicamento, selectedValue), mensaje);
            }
          } else {
            Swal.fire(
              'Falta!',
              `No has seleccionado la bodega para proceder con el tramite del medicamento ${itemt.nombre}`, 
              'warning'
            );
          }
        }
      });
    });
  }
  
  private async listadeBodegas(): Promise<string | undefined> {
    try {
      const resp: any = await this.servicioBodega.getRegistrosActivos().toPromise();
      return resp.map((item: { idBodega: any; nombre: any }) => 
        `<option value="${item.idBodega}">${item.idBodega} - ${item.nombre}</option>`
      ).join('');
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  public agregarMedicamentotodasBodega(itemt: any): void {       
      Swal.fire({    
        title: 'Confirmar',
        text: `Agregar el medicamento ${itemt.nombre} en todas las bodegas activas!`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Si, agregar!'
      }).then((result) => {
        if (result.isConfirmed) { 
            this.servicio.agregarMedicamentoBodegatodas (itemt.idMedicamento).subscribe(resp => {            
              Swal.fire({
                icon: 'success',
                title: `Ok`,
                text: `El medicamento ha sido agregado correctamente.`,
              });
            },
              err => {
                Swal.fire({
                  icon: 'error',
                  title: `Error`,
                  text: err.error.mensaje,
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

  reporteEnConstruccion() {
    Swal.fire({
      icon: 'info',
      title: `En construcción!`,
      text: `El proceso esta en proceso de construcción, te estaremos informando cuando esté disponible!`,
    });
  }


}

