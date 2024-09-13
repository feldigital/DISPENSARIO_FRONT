import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacienteI } from 'src/app/modelos/paciente.model';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { PacienteService } from 'src/app/servicios/paciente.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-paciente',
  templateUrl: './paciente.component.html',
  styleUrls: ['./paciente.component.css']
})
export class PacienteComponent implements OnInit {
  generalForm!: FormGroup;
  nombrebtn!: string;
  //listaregistros: any;
  //banderaRegistro!: boolean;
  listaDpto: any;
  listaMpio: any;
  listaMpioPortabilidad: any;
  listaEps: any;
  listaCategoria: any;
  //listaFormula: any;
  parametro: any;
  hoy!: string;
 // mostrarComponente: Boolean=false;
 // datoParaHijo: number = NaN;


  constructor(
    private fb: FormBuilder,
    private servicio: PacienteService,
    private servicioBodega: BodegaService,
    private activatedRoute: ActivatedRoute,

  ) {

    //this.cargarRegistros();
    this.nombrebtn = "Crear";
   // this.banderaRegistro = true;
    this.cargarDepartamentos();
    this.cargarEps();
    this.cargarCategoria();


  }

  ngOnInit(): void {
    this.crearFormulario();

    this.activatedRoute.paramMap.subscribe(params => {
      let pacienteId = +params.get('id')!;
      console.log("llegue al componente para modificación: ");
      this.servicio.getRegistroId(pacienteId).subscribe(cliente => {       
        this.mostrarRegistro(cliente);   
        console.log("llegue al componente para modificación: ");  
        console.log(cliente);
      });
    });
    const today = new Date();
    this.hoy = today.toISOString().split('T')[0];  // Formato YYYY-MM-DD
  }


  onDptoSeleccionado() {
    const dptoSeleccionado = this.generalForm.get('departamento')?.value;
    this.servicioBodega.getMunicipiosDepartamento(dptoSeleccionado).subscribe((resp: any) => {
      this.listaMpio = resp;
    },
      (err: any) => { console.error(err) }
    );

  }
  
  onDptoPortabilidadSeleccionado() {
    const dptoSeleccionado = this.generalForm.get('dptoportabilidad')?.value;
    this.servicioBodega.getMunicipiosDepartamento(dptoSeleccionado).subscribe((resp: any) => {
      this.listaMpioPortabilidad  = resp;
    },
      (err: any) => { console.error(err) }
    );

  }

  cargarDepartamentos() {
    this.servicioBodega.getDepartamentos()
      .subscribe((resp: any) => {
        this.listaDpto = resp;
      },
        (err: any) => { console.error(err) }
      );
  }
  cargarEps() {
    this.servicio.getEps()
      .subscribe((resp: any) => {
        this.listaEps = resp;
        
      },
        (err: any) => { console.error(err) }
      );
  }
  cargarCategoria() {
    this.servicio.getCategoria()
      .subscribe((resp: any) => {
        this.listaCategoria = resp;
     
      },
        (err: any) => { console.error(err) }
      );
  }
  buscarDocumento(){
    const numDocumento = this.generalForm.get('numDocumento')?.value;
    if (numDocumento) {
      // Lógica para buscar el documento      
      this.servicio.getRegistroDocumento(numDocumento).subscribe(
        (respuesta) => {
          if (respuesta) {
            Swal.fire({
              icon: 'info',
              title: `EXISTE`,
              text: `El documento  número  ` + numDocumento + ` que esta ingresando ya existe con el nombre `+ respuesta.pNombre + ' ' +  respuesta.sNombre +' '+  respuesta.pApellido +' '+  respuesta.sApellido ,
            });
            this.mostrarRegistro(respuesta);          
          } else {
            console.log('Documento no encontrado');           
          }
        },
        (error) => {
          console.error('Error al buscar el documento', error);
        }
      );
        } 

  }

  /*FUNCION DE CREACION DEL FORMULARIO*/
  crearFormulario() {
    this.generalForm = this.fb.group
      ({
        idPaciente: [''],
        tipoDoc: ['', [Validators.required]],
        numDocumento: ['', [Validators.required]],
        pApellido: ['', [Validators.required]],
        sApellido: [''],
        pNombre: ['', [Validators.required]],
        sNombre: [''],
        estado: ['true', [Validators.required]],
        fecNacimiento: [''],
        sexo: [''],
        zona: [''],
        barrio: [''],
        direccion: [''],
        celularPrincipal: [''],
        celularSecundario: [''],
        email: [''],
        eps: [''],
        regimen: [''],
        tipoAfiliado: [''],
        categoria: [''],
        //tipoPoblacion: [''],
        //categoriaSisben: [''],
        departamento: [''],
        municipio: [''],
        dispensario: [''],

        portabilidad: [false],
        dptoportabilidad: [''],
        mpoportabilidad: [''],
        fecVencePortabilidad: [''],

      });
  }



  mostrarRegistro(itemt: any) {
   // this.mostrarComponente=true;
   // this.datoParaHijo=itemt.idPaciente;
    this.nombrebtn = "Actualizar"
  // Convertir las fechas solo si no son null o undefined
  var fn = itemt.fecNacimiento ? new Date(itemt.fecNacimiento) : null;
  var fp = itemt.fecVencePortabilidad ? new Date(itemt.fecVencePortabilidad) : null;

    this.servicioBodega.getMunicipiosDepartamento(itemt.departamento).subscribe(
      (municipios: any[]) => {
        this.listaMpio = municipios;
        // Una vez cargados los municipios, establece los valores del formulario
       // this.listaFormula=itemt.formulas;
        this.generalForm.setValue({
          idPaciente: itemt.idPaciente,
          pApellido: itemt.pApellido,
          sApellido: itemt.sApellido,
          pNombre: itemt.pNombre,
          sNombre: itemt.sNombre,
          tipoDoc: itemt.tipoDoc,
          numDocumento: itemt.numDocumento,
          // Asignar null si fn es null, de lo contrario asignar la fecha en formato ISO
          fecNacimiento: fn ? fn.toJSON().slice(0, 10) : null,
          sexo: itemt.sexo,
          zona: itemt.zona,
          barrio: itemt.barrio,
          direccion: itemt.direccion,
          celularPrincipal: itemt.celularPrincipal,
          celularSecundario: itemt.celularSecundario,
          email: itemt.email,
          eps: itemt.eps.codigo,
          regimen: itemt.regimen,
          tipoAfiliado: itemt.tipoAfiliado,
          categoria: itemt.categoria.codigo,
          //tipoPoblacion: itemt.tipoPoblacion,
          //categoriaSisben: itemt.categoriaSisben,
          departamento: itemt.departamento,
          municipio: itemt.municipio.codigo,
          estado: itemt.estado,
          dispensario: itemt.dispensario,

          dptoportabilidad: itemt.dptoportabilidad || '',
          mpoportabilidad:itemt.mpoportabilidad?.codigo || '',
          portabilidad: itemt.portabilidad,
          // Asignar null si fp es null, de lo contrario asignar la fecha en formato ISO
        fecVencePortabilidad: fp ? fp.toJSON().slice(0, 10) : null,

        })
      },
      (err) => {
        console.error(err);
      }
    );
  }

  create() {
    if (this.generalForm.valid) {
      if (this.nombrebtn == "Crear") {
        this.servicio.create(this.generalForm.value).subscribe(ciclo => {
     //     this.cargarRegistros();
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El paciente ha sido creado correctamente`,
          });
          this.nombrebtn = "Crear";
          this.generalForm.reset();
     //     this.mostrarComponente=false;
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo guardar el paciente en la base de datos!',
              footer: err.mensaje //JSON.stringify(err)
            });
          }
        );
      }
      else {
        this.servicio.update(this.generalForm.value).subscribe(ciclo => {

          //this.cargarRegistros();
          this.nombrebtn = "Crear";
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El paciente ha sido actualizado correctameente`,
          });
          this.generalForm.reset();
       //   this.mostrarComponente=false;

        },
          err => {
            Swal.fire({
              icon: 'error',
              title: 'Error...',
              text: 'No se pudo actualizar el paciente en la base de datos!',
              footer: err.mensaje
            });
          });
      }

    } else {
      Swal.fire({
        icon: 'warning',
        title: "!Alerta",
        text: 'Datos incompletos para crear el paciente en la base de datos!'
      });

    }

  }

/*
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
*/


  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }


}

