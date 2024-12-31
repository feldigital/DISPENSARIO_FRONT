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
  mostrarPortabilidad = false;
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
      
      this.servicio.getRegistroId(pacienteId).subscribe(cliente => {
        this.mostrarRegistro(cliente);              
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
      this.listaMpioPortabilidad = resp;
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
  buscarDocumento() {
    const numDocumento = this.generalForm.get('numDocumento')?.value;
    if (numDocumento) {
      // Lógica para buscar el documento      
      this.servicio.getRegistroDocumento(numDocumento).subscribe(
        (respuesta) => {

          if (respuesta && respuesta.length > 1) {
            Swal.fire({
                icon: 'error',
                title: `DOCUMENTO DUPLICADO`,
                text: `Este documento está duplicado en la base de datos. Identifique claramente al paciente para entregar el medicamento.`,
            });
           return;
        }
        if (respuesta && respuesta.length === 1) {         
            Swal.fire({
              icon: 'info',
              title: `EXISTE`,
              text: `El documento  número  ` + numDocumento + ` que esta ingresando ya existe con el nombre ` + respuesta[0].pNombre + ' ' + respuesta[0].sNombre + ' ' + respuesta[0].pApellido + ' ' + respuesta[0].sApellido,
            });
            this.mostrarRegistro(respuesta[0]);
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
        estado: [true, [Validators.required]],
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
    // Obtener municipios del departamento del paciente
    this.servicioBodega.getMunicipiosDepartamento(itemt.departamento).subscribe(
      (municipios: any[]) => {
        this.listaMpio = municipios;
        // Establecer los valores del formulario después de obtener los municipios del paciente
        this.generalForm.patchValue({
          municipio: itemt.municipio?.codigo || ''  // Asegura que haya un valor por defecto
        });
      },
      (err) => {
        console.error(err);
      }
    );

    // Si el paciente está en portabilidad, obtener municipios del departamento de portabilidad
    if (itemt.portabilidad) {
      this.servicioBodega.getMunicipiosDepartamento(itemt.dptoportabilidad).subscribe(
        (municipios: any[]) => {
          this.listaMpioPortabilidad = municipios;  // Asigna la lista de municipios para portabilidad
          this.generalForm.patchValue({
            mpoportabilidad: itemt.mpoportabilidad?.codigo || ''
          });
        },
        (err) => {
          console.error(err);
        }
      );
    }

  // Usar patchValue para establecer los valores del formulario sin necesidad de todos los controles
  this.generalForm.patchValue({
    idPaciente: itemt.idPaciente,
    pApellido: itemt.pApellido,
    sApellido: itemt.sApellido,
    pNombre: itemt.pNombre,
    sNombre: itemt.sNombre,
    tipoDoc: itemt.tipoDoc,
    numDocumento: itemt.numDocumento,
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
    departamento: itemt.departamento,
    estado: itemt.estado,
    dispensario: itemt.dispensario,
    dptoportabilidad: itemt.dptoportabilidad || '',
    portabilidad: itemt.portabilidad,
    fecVencePortabilidad: fp ? fp.toJSON().slice(0, 10) : null
  });

    // Ejecutar manualmente la función onPortabilidadChange si es necesario
    this.onPortabilidadChange({ target: { checked: itemt.portabilidad } });

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

  onPortabilidadChange(event: any): void {
    this.mostrarPortabilidad = event.target.checked;
  }

 

  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }


}

