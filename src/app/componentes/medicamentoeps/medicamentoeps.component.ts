import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, map, Observable, of, switchMap } from 'rxjs';
import { FormulaService } from 'src/app/servicios/formula.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MedicamentoService } from 'src/app/servicios/medicamento.service';
import Swal from 'sweetalert2';
import { PacienteService } from 'src/app/servicios/paciente.service';
import { EpsMedicamentoI } from 'src/app/modelos/epsMedicamento.model';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-medicamentoeps',
  templateUrl: './medicamentoeps.component.html',
  styleUrls: ['./medicamentoeps.component.css']
})
export class MedicamentoepsComponent {

 generalForm!: FormGroup;
  listaItemEps: any = [];
  listaItemEpsFiltro: any = [];
  medicamentosFiltrados: any[] = [];
  medicamentoActual: any = NaN;
  listaEps:any;
  verItem: boolean = false;

  constructor(
    private medicamentoServicio: MedicamentoService,
    private pacienteServicio: PacienteService,
    private formulaService: FormulaService,    
    private fb: FormBuilder   
   ) { }

  ngOnInit(): void {
    this.generalForm = this.fb.group
    ({
      medicamento:[''],
      contrato: [''],
      valor: [''],
      descuento: [''],   
      listFilter: [''], 
     });

     this.cargarEps();

     this.generalForm.get('medicamento')!.valueChanges
        .pipe(
          debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir    
          map(value => {
                if (typeof value === 'string') {
                  return value.trim().toLowerCase();
                } else if (value && typeof value === 'object' && 'nombre' in value) {
                  return value.nombre.toLowerCase(); // si ya seleccionó un medicamento
                } else {
                  return '';
                }
              }),    
          switchMap(query => {
          if (query.length >= 3 ) {
              return this.formulaService.filtrarMedicamentos(query);
          } else {
            return of([]);
          }
        })
      )
        .subscribe(results => {
          this.medicamentosFiltrados = results;
        });
    
    this.generalForm.get('listFilter')!.valueChanges.pipe(
      debounceTime(300),
      switchMap((query) => this.buscarMedicamentos(query))
    )
    .subscribe((results) => {
      this.listaItemEpsFiltro = results;
    });
  }



buscarMedicamentos(filterValue: string): Observable<any[]> {
  if (filterValue && filterValue.trim().length > 3) {
    const palabras = filterValue.toLowerCase().trim().split(/\s+/); // dividir por espacios
    const filteredResults = this.listaItemEps.filter((item: any) => {
      const nombre = item.nombre.toLowerCase();
      // Verificar que todas las palabras estén en el nombre
      return palabras.every(palabra => nombre.includes(palabra));
    });
    return of(filteredResults);
  }
  // Si no hay filtro, devolver la lista completa
  return of(this.listaItemEps);
}


  cargarEps() {
    this.pacienteServicio.getEps()
      .subscribe((resp: any) => {
        this.listaEps = resp;

      },
        (err: any) => { console.error(err) }
      );
  }

     seleccionarMedicamento(event: MatAutocompleteSelectedEvent): void {
      this.medicamentoActual = event.option.value;     
      this.generalForm.get('medicamento')?.setValue(event.option.value.nombre);
     
      this.buscarRegistro(this.medicamentoActual.idMedicamento);

      this.verItem = false;
          try {
            if (!this.medicamentoActual) {
              throw new Error('No seha seleccionado el medicamento.');
            }               
      
            this.verItem = true;
      
          } catch (error) {
            console.error('Error al seleccionar medicamento:', error); // Depuración
            let errorMessage = 'Hubo un problema al validar el medicamento.';
            // Verificamos si `error` es una instancia de Error y tiene mensaje
            if (error instanceof Error) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error; // Si es un string, lo usamos como mensaje
            }
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            });
          }      
    }

  buscarRegistro(idMedicamento: number): Observable<any[]> {     
    if(idMedicamento){
        this.medicamentoServicio.getMedicamentoContrato(idMedicamento)
          .subscribe((resp: any) => {           
            this.listaItemEps = resp.sort((a: any, b: any) => a.principioActivo.localeCompare(b.principioActivo));   
            });
        return of(this.listaItemEps); // Usa `this` para referirte a la variable de instancia
      }
      // Retornar la lista vacía si no se cumplen las condiciones
      return of([]);
  }

 
   quitarMedicamentoContrato(itemt: any) {
     Swal.fire({
       title: 'Desea quitar?',
       text: 'El medicamento ' + itemt.nombre + ' del contrato con ' + itemt.concentracion + ' ' +itemt.principioActivo,
       icon: 'question',
       showCancelButton: true,
       confirmButtonColor: '#3085d6',
       cancelButtonColor: '#d33',
       confirmButtonText: 'Si, quitar!'
     }).then((result) => {
       if (result.isConfirmed) {
         this.medicamentoServicio.quitarMedicamento(itemt.idMedicamento,itemt.concentracion).subscribe(resp => {
          this.listaItemEps = this.listaItemEps.filter((cli: any) =>
            !(cli.idMedicamento === itemt.idMedicamento && cli.concentracion === itemt.concentracion)
          );
           Swal.fire({
             icon: 'success',
             title: `Ok`,
             text: `El medicamento ha sido quitado del contrato a partir de la fecha ya no se podra transcribir en la formula para un paciente aosociado a ese asegurador.`,
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

   validarYGuardarMedicamentoContratado() {
    const contrato = this.generalForm.get('contrato')?.value;
    const valor = this.generalForm.get('valor')?.value;
    const descuento = this.generalForm.get('descuento')?.value;

    console.log(this.generalForm.get('contrato'));
    console.log(contrato);
  
    if (!this.existeItem(this.medicamentoActual.idMedicamento, this.generalForm.get('contrato')?.value)) {
      // Validación de campos requeridos
      if (!contrato || valor === '' || valor === null || descuento === '' || descuento === null) {
        Swal.fire({
          icon: 'warning',
          title: 'Campos obligatorios',
          text: 'Por favor, complete todos los campos que se necesitan para agregar el medicamento al contrato antes de continuar.',
        });
        return;
      }
  
      // Validación de valores negativos
      if (valor < 0 || descuento < 0 || descuento > 100) {
        Swal.fire({
          icon: 'error',
          title: 'Valores incorrectos',
          text: `No se puede agregar el medicamento al contrato con valores negativos.`,
        });
        return;
      }
  
      // Confirmación
      Swal.fire({
        title: '¿Desea agregar?',
        text: `El medicamento ${this.medicamentoActual.nombre} al contrato seleccionado.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, agregar!'
      }).then((result) => {
        if (result.isConfirmed) {
          const epsMedicamento = new EpsMedicamentoI();
          epsMedicamento.idMedicamento = this.medicamentoActual.idMedicamento;
          epsMedicamento.codEps = this.generalForm.get('contrato')?.value;
          epsMedicamento.valorVenta = valor;
          epsMedicamento.descuento = descuento;
  
          this.medicamentoServicio.adicionarMedicamento(epsMedicamento).subscribe({
            next: (response) => {
             // this.verItem = false;
              this.buscarRegistro(this.medicamentoActual.idMedicamento);
              Swal.fire({
                icon: 'success',
                title: 'Medicamento agregado',
                text: `Se agregó el medicamento ${this.medicamentoActual.nombre} al contrato ${epsMedicamento.codEps} correctamente.`,
              });
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
              });
            }
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `El medicamento ${this.medicamentoActual.nombre} que está intentando agregar ya se encuentra asociado a ese contrato. Por lo tanto, no se puede adicionar.`,
      });
    }
  }
  
    
     
     existeItem(id: number, eps: string): boolean {
       let existe = false;
       this.listaItemEps.forEach((item: any) => {
         if ( id === item.idMedicamento && eps === item.concentracion) {
           existe = true;
         }        
       });
       return existe;
     }
      

     public consultarContratacion(): void {
      const contrato = this.generalForm.get('contrato')?.value;    
      if (!contrato) {
         Swal.fire({
                  icon: 'info',
                  title: `Seleccione contrato`,
                  text: `No ha seleccionado el asegurador para realizar la consulta!`,
                });
        return ; // Retorna vacío si no hay contrato seleccionado
      }
    
      // Limpiar listas antes de cargar nueva data
      this.listaItemEps = [];
      this.listaItemEpsFiltro = [];
    
      // Mostrar spinner mientras carga
      Swal.fire({
        title: 'Cargando registros...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });    
      this.medicamentoServicio.getMedicamentoContratoEps(contrato)
        .subscribe({
          next: (resp: any) => {
            
            this.listaItemEps = resp.sort((a: any, b: any) => 
              a.nombre.localeCompare(b.nombre)    );
            this.listaItemEpsFiltro= this.listaItemEps;
            Swal.close(); // Cierra spinner al terminar correctamente           
          },
          error: (error) => {
            console.error('❌ Error cargando registros', error);
            Swal.close(); // Cierra spinner antes de mostrar error
            Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
          }
        });    
      // No necesitas retornar nada aquí
    }
    

     public exportarExcelContratacion(){
      // Crea un array con los datos que deseas exportar     
      const contrato = this.generalForm.get('contrato')?.value;  
      const datos: any[] = [];      
      // Encabezados de la tabla
      const encabezado = [
        'CONSECUTIVO',       
        'CUM',
        'ID',        
        'NOMBRE DEL MEDICAMENTO',          
        'PRESENTACION',
        'CONTRATO',
        'EPS',
        'VALOR CONTRATADO',
        'DESCUENTO',
        
      ];
  
      datos.push(encabezado);
      
      // Agrega los items de despacho al array
      this.listaItemEps.forEach((item: any, index: number) => {
        datos.push([
          index + 1, // Índice (puedes empezar desde 1 si deseas numeración humana)         
          item.codigoCum || '',
          item.idMedicamento || '',
          item.nombre || '',
          item.viaNombre || '',
          item.concentracion || '',
          item.principioActivo || '',
          item.valor || '0',
          item.descuento || '0'
        ]);
      });
      // Crea la hoja de trabajo de Excel (worksheet)
      const hojaDeTrabajo: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(datos);
  
      // Aplicar formato al encabezado
      const rangoEncabezado = XLSX.utils.decode_range(hojaDeTrabajo['!ref'] as string);
      for (let col = rangoEncabezado.s.c; col <= rangoEncabezado.e.c; col++) {
        const celda = hojaDeTrabajo[XLSX.utils.encode_cell({ r: 0, c: col })]; // Primera fila, r: 0
        if (celda) {
          celda.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } }, // Texto en negrita y color blanco
            alignment: { horizontal: "center", vertical: "center" }, // Centrado horizontal y vertical
            fill: { fgColor: { rgb: "4F81BD" } }, // Color de fondo azul
          };
        }
      }
  
      // Crea el libro de trabajo (workbook)
      const libroDeTrabajo: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, contrato);
      // Genera y descarga el archivo Excel
      XLSX.writeFile(libroDeTrabajo, 'Contratacion_' + contrato +'_'+ new Date().getTime() + '.xlsx');
      Swal.fire({
        icon: 'success',
        title: `Ok`,
        text: `Su reporte fue exportado en su carpeta de descargas en formato xlsx`,
  
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
