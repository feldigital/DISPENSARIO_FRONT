import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs';
import { PacienteI } from 'src/app/modelos/paciente.model';
import { PacienteService } from 'src/app/servicios/paciente.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-buscarpaciente',
  templateUrl: './buscarpaciente.component.html',
  styleUrls: ['./buscarpaciente.component.css']
})
export class BuscarpacienteComponent {
  listaregistros: any;
  listaPaciente: any;
  generalForm!: FormGroup;
  selectedFile: File | null = null;
  isLoading = false;
  listaImportacion: any;
  loadingAccion: { [index: number]: boolean } = {};
  btnGuardar = false;


  constructor(
    private servicio: PacienteService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar

  ) {

    this.generalForm = this.fb.group
      ({
        documento: [''],
        pNombre: [''],
        sNombre: [''],
        pApellido: [''],
        sApellido: [''],
      });

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

    this.generalForm.get('documento')!.valueChanges
      .pipe(
        debounceTime(300), // Espera 300 ms después de que el usuario deja de escribir         
        switchMap(query => {
          const documento = this.generalForm.get('documento')?.value || '';

          return this.servicio.getRegistroDocumento(documento);
        })
      )
      .subscribe(results => {
        this.listaregistros = results;
      });
  }

  eliminarRegistro(itemt: PacienteI) {
    Swal.fire({
      title: 'Desea eliminar?',
      text: `El paciente ${itemt.pNombre} ${itemt.pApellido} de la base de datos.`,
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


  exportarPacientes() {
    this.listadeEps().then((listadeEps: string) => {
      Swal.fire({
        title: '<h5 class="mb-3 fw-bold text-primary">Seleccionar EPS paciente</h5>',
        html: `
          <div class="form-group text-start">
            <label for="selectEps" class="form-label">EPS disponibles</label>
            <select id="selectEps" class="form-select form-select-sm border-secondary" multiple size="6">              
              ${listadeEps}
            </select>
            <small class="form-text text-muted mt-1">
              Mantén presionado <strong>Ctrl</strong> (Windows) o <strong>Cmd</strong> (Mac) para seleccionar varias opciones.
            </small>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '📤 Exportar',
        cancelButtonText: '❌ Cancelar',
        focusConfirm: false,
        customClass: {
          popup: 'swal-wide',
          confirmButton: 'btn btn-success px-4 me-2',
          cancelButton: 'btn btn-outline-secondary px-4'
        },
        buttonsStyling: false,
        preConfirm: () => {
          const select = document.getElementById('selectEps') as HTMLSelectElement;
          const selected = Array.from(select.selectedOptions).map(opt => opt.value);
          if (!selected.length) {
            Swal.showValidationMessage('Debe seleccionar al menos una EPS para exportar los pacientes.');
          }
          return selected;
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const seleccionadas = result.value as string[];
  
          Swal.fire({
            title: 'Generando registros...',
            html: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
  
          // Declarar fuera del if/else
          let registro: { control: number; valores: string[] };
  
          if (seleccionadas.includes('*')) {
           
            registro = {
              control: 0,
              valores: seleccionadas
            };
          } else {
           
            registro = {
              control: 1,
              valores: seleccionadas
            };
          }  
          this.servicio.exportarPacientes(registro).subscribe(
            resp => {
              this.listaPaciente = resp;           
              Swal.close();
              this.exportarExcelPaciente();             
            },
            error => {
              console.error('❌ Error cargando registros', error);
              Swal.close();
              Swal.fire('Error', 'No se pudieron cargar los registros para exportar.', 'error');
            }
          );
        }
      });
    });
  }
  

  private async listadeEps(): Promise<string> {
    try {
      const resp = await this.servicio.getEps().toPromise();
      if (!resp || !Array.isArray(resp)) throw new Error('Respuesta no válida');

      return `<option value="*">Todas</option>` + resp.map((item: { codigo: any; nombre: any }) =>
        `<option value="${item.codigo}">${item.codigo} - ${item.nombre}</option>`
      ).join('');
    } catch (err) {
      console.error('Error al cargar EPS:', err);
      Swal.fire('Error', 'No se pudo cargar la lista de EPS.', 'error');
      return ''; // Evita devolver undefined
    }
  }


       public exportarExcelPaciente(){
        // Crea un array con los datos que deseas exportar     
       
        const datos: any[] = [];      
        // Encabezados de la tabla
        const encabezado = [
          'CONSECUTIVO','TIPO ID',
          'NUMERO IDENTIFICACION',
          'PRIMER APELLIDO',
          'SEGUNDO APELLIDO',
          'PRIMER NOMBRE',
          'SEGUNDO NOMBRE',
          'FECHA DE NACIMIENTO',
          'GENERO','ZONA',
          'DIRECCION','BARRIO',
          'TELEFONO PRINCIPAL',
          'TELEFONO SECUNDARIO',
          'CORREO ELECTRONICO',
          'DEPARTAMENTO AFILIACION',
          'MUNICIPIO AFILIACION',
          'EPS','REGIMEN','CATEGORIA',
          'TIPO AFILIADO','DROGUERIA',
          'ESTADO','PAVE','PORTABILIDAD',
          'DEPARTAMENTO PORTABILIDAD',
          'MUNICIPIO PORTABILIDAD',
          'FECHA VENCE PORTABILIDAD',
          'FECHA DE AFILIACION','ID_PACIENTE'
                
        ];
    
        datos.push(encabezado);       

        
        // Agrega los items de despacho al array
        this.listaPaciente.forEach((item: any, index: number) => {
          datos.push([
            index + 1, // Índice (puedes empezar desde 1 si deseas numeración humana)         
            item.tipoDoc || '',
            item.numDocumento || '',
            item.pApellido?.toUpperCase() || '',
            item.sApellido?.toUpperCase() || '',
            item.pNombre?.toUpperCase() || '',
            item.sNombre?.toUpperCase() || '',            
            item.fecNacimiento ? new Date(item.fecNacimiento).toLocaleDateString("es-ES", {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : '',
            item.sexo || '',
            item.zona || '',           
            item.direccion || '',
            item.barrio || '',
            item.celularPrincipal || '',
            item.celularSecundario || '',
            item.email?.toLowerCase() || '',
            item.departamento || '',
            item.municipio || '',
            item.eps || '',
            item.regimen || '',
            item.categoria || '',
            item.tipoAfiliado || '',
            item.dispensario || '',
            item.estado ? 'Activo' : 'Inactivo',
            item.pave ? 'SI' : '',
            item.portabilidad ? 'SI' : '',
            item.dptoportabilidad || '',
            item.mpoportabilidad || '',
            item.fecVencePortabilidad ? new Date(item.fecVencePortabilidad).toLocaleDateString("es-ES", {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : '',
           
            item.fecAfiliacion || '' ? new Date(item.fecAfiliacion).toLocaleDateString("es-ES", {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) : '',
            item.idPaciente || ''
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
        XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'BD');
        // Genera y descarga el archivo Excel
        XLSX.writeFile(libroDeTrabajo, 'Base_Dato_'+ new Date().getTime() + '.xlsx');
        Swal.fire({
          icon: 'success',
          title: `Ok`,
          text: `La base de  datos de las EPS seleccionadas fue exportado correctamente, en su carpeta de descargas en formato xlsx`,
            });
      }
  
      onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
      }
    
      onUpload() {
        if (this.selectedFile) {
          this.isLoading = true;      
          this.servicio.importarPacientes(this.selectedFile).subscribe({
            next: (resp) => {
              this.isLoading = false;
              this.listaImportacion=resp;
              this.snackBar.open(resp, 'Cerrar', { duration: 3000 });
            },
            error: (err) => {
              this.isLoading = false; // ¡Esto es importante!
              this.snackBar.open('Error al importar: ' + err.error, 'Cerrar', {
                duration: 5000,
              });
            }
          });
        }
      }
      
      insertarNuevos(registros:number, index: number) {
        if (this.loadingAccion[index] || this.btnGuardar){
          Swal.fire({
            icon: 'info',
            title: `Registros ya guardados`,
            text: `Los registros ya fueron guardados correctamente a la Base de Datos, no se deben duplicar`,
                   });   
           return; // ❌ Evita doble clic si ya está en proceso
        }
        this.loadingAccion[index] = true;      
        Swal.fire({
             title: '¿Agregar pacientes?',
             text: `Se agregaran ${registros.toString()}  registros de pacientes OK que fueron importados y no tienen error en la estructura!`,
             icon: 'question',
             showCancelButton: true,
             confirmButtonColor: '#3085d6',
             cancelButtonColor: '#d33',
             confirmButtonText: 'Si, agregar!',             
             cancelButtonText: '❌ Cancelar',
           }).then((result) => {
             if (result.isConfirmed) {
              
              Swal.fire({
                title: 'Agregando registros...',
                html: 'Por favor espera un momento',
                allowOutsideClick: false,
                didOpen: () => {
                  Swal.showLoading();
                }
              });
              this.loadingAccion[index] = true;
             

              this.servicio.insertarNuevosPacientes().subscribe({
                next: () => {
                  this.loadingAccion[index] = false;
                  this.btnGuardar=true;
                   Swal.close();
                   Swal.fire({
                        icon: 'success',
                        title: `Ok`,
                        text: `Los registros nuevos fueron agregados correctamente a la Base de Datos.`,
                               });                
                },
                error: (err) => 
                {          
                  Swal.close();
                  this.loadingAccion[index] = false;
                 // this.btnGuardar=false;
                  Swal.fire('Error', 'Se produjo un error agregando los registros a la base de datos de paciente.', 'error');          
                 
                }
              });              
               
            } else {
              this.loadingAccion[index] = false; // Cancelado: liberamos el botón
              //this.btnGuardar=false;
            }
           });




        
      }
      
  actualizarRegistros(index: number) {
    if (this.loadingAccion[index] ){     
       return; // ❌ Evita doble clic si ya está en proceso
    }
    this.loadingAccion[index] = true;    
  
      Swal.fire({
        title: '<h5 class="mb-3 fw-bold text-primary">Seleccionar CAMPOS a actualizar</h5>',
        html: `
          <div class="form-group text-start">
            <label for="selectEps" class="form-label">Campos disponibles</label>
            <select id="selectEps" class="form-select form-select-sm border-secondary" multiple size="6">              
             <option value='*'>Todos los campos</option>           
		         <option value='p_apellido'>PRIMER APELLIDO</option>
             <option value='s_apellido'>SEGUNDO APELLIDO</option>
             <option value='p_nombre'>PRIMER NOMBRE</option>
             <option value='s_nombre'>SEGUNDO NOMBRE</option>
             <option value='fec_nacimiento'>FECHA DE NACIMIENTO</option>
             <option value='sexo'>SEXO</option>
             <option value='zona'>ZONA</option>
             <option value='direccion'>DIRECCION</option>
             <option value='barrio'>BARRIO</option>
             <option value='celular_principal'>TELEFONO PRINCIPAL</option>

             <option value='celular_secundario'>TELEFONO SECUNDARIO</option>
             <option value='email'>CORREO ELECTRONICO</option>
             <option value='municipio'>MUNICIPIO DE AFILIACION</option>
             <option value='departamento'>DEPARTAMENTO DE AFILIACION</option>
             <option value='cod_eps'>EPS</option>
             <option value='regimen'>REGIMEN</option>
             <option value='categoria'>CATEGORIA</option>
             <option value='tipo_afiliado'>TIPO DE AFILIADO</option>
             <option value='dispensario'>DISPENSARIO</option>
             <option value='estado'>ESTADO</option>
             <option value='pave'>PAVE</option>
             <option value='portabilidad'>PORTABILIDAD</option>
             <option value='dptoportabilidad'>DEPARTAMENTO EN PORTABILIDAD</option>
             <option value='mpoportabilidad'>MUNICIPIO EN PORTABILIDAD</option>
             <option value='fec_vence_portabilidad'>FECHA DE VENCIMIENTO DE LA PORTABILIDAD</option>
           
           
            </select>
            <small class="form-text text-muted mt-1">
              Mantén presionado <strong>Ctrl</strong> (Windows) o <strong>Cmd</strong> (Mac) para seleccionar varias opciones.
            </small>
           <br>
            <small class="form-text text-muted mt-1">
              Ejemplo DATO_ACTUAL = <strong>DATO_NUEVO</strong> de cada campo seleccionado.
            </small>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: '❌ Cancelar',
        focusConfirm: false,
        customClass: {
          popup: 'swal-wide',
          confirmButton: 'btn btn-success px-4 me-2',
          cancelButton: 'btn btn-outline-secondary px-4'
        },
        buttonsStyling: false,
        preConfirm: () => {
          const select = document.getElementById('selectEps') as HTMLSelectElement;
          const selected = Array.from(select.selectedOptions).map(opt => opt.value);
          if (!selected.length) {
            Swal.showValidationMessage('Debe seleccionar al menos un CAMPO para realizar la actualización.');
          }
          return selected;
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const seleccionadas = result.value as string[];
  
          Swal.fire({
            title: 'Actualizando registros...',
            html: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          }); 
     
          // Declarar fuera del if/else
          let registro: { control: number; valores: string[] };  
          if (seleccionadas.includes('*')) {
             registro = {
              control: 0,
              valores: seleccionadas
            };
          } else { 
            registro = {
              control: 1,
              valores: seleccionadas
            };
          }

          this.servicio.actualizarPacienteTemporal(registro).subscribe(
            resp => {
             console.log(resp);
              this.loadingAccion[index] = false;           
              Swal.close();
              Swal.fire({
                icon: 'success',
                title: `Ok`,
                text: `Se actualizadon XXX registros correctamente a la Base de Datos de paciente en los campos seleccionados.`,
                       });   
                      
            },
            error => {
              console.error('❌ Error actualizando registros en la tabla paciente', error);
              this.loadingAccion[index] = false;
              Swal.close();
              Swal.fire('Error', 'No se pudieron actualizar los registros a latabla paciente.', 'error');
            });
          } else {
            this.loadingAccion[index] = false; // Cancelado: liberamos el botón
            //this.btnGuardar=false;
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
