import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ItemFormulaEntregaI } from 'src/app/modelos/itemformulaentrega.model';
import { FormulaService } from 'src/app/servicios/formula.service';
import { MedicamentoService } from 'src/app/servicios/medicamento.service';
import { PacienteService } from 'src/app/servicios/paciente.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-entregas',
  templateUrl: './entregas.component.html',
  styleUrls: ['./entregas.component.css']
})
export class EntregasComponent implements OnInit, OnChanges {

  listaItemsFormula: any;
  //listaregistros: any;
  listaregistros: any = {};
  parametro: any;
  @Input() formulaRecibida: number = NaN;
  existencias: { [key: number]: number } = {};
  hoy!: string;

  constructor(
    private servicio: PacienteService,
    private medicamentoService: MedicamentoService,
    private servicioformula: FormulaService,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.parametro = this.formulaRecibida
    this.activatedRoute.paramMap.subscribe(params => {
      this.parametro = params.get('id');
      if (this.parametro) {
        this.buscarRegistro(this.parametro);
      }
    });
    if (this.formulaRecibida) {
      this.buscarRegistro(this.formulaRecibida);
      this.parametro = this.formulaRecibida;
    }

    this.hoy = new Date().toISOString().split('T')[0];
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datoRecibido'] && !changes['datoRecibido'].isFirstChange()) {
      this.buscarRegistro(this.formulaRecibida);
    }
  }

  public buscarRegistro(id: number) {
    this.servicioformula.getFormulaId(id)
      .subscribe((resp: any) => {
        this.listaregistros = resp;        
        this.listaItemsFormula = resp.items;
        //this.listaItemsFormula.sort((a: any, b: any) => b.idFormula - a.idFormula);
      });
  }

  public async entregarPendiente(itemt: any) {
    try {
      let bodegaString = sessionStorage.getItem("bodega");
      let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
      let funcionario = sessionStorage.getItem("nombre");
      const cantidad = await this.existenciaAcutal(itemt.medicamento.idMedicamento, bodega);
      Swal.fire({
        title: "Entrega de pendiente",
        html: `  
        <div class="swal-container">           
    <div>${itemt.medicamento.nombre}<br><br>Cantidad en bodega: ${cantidad}</div>
    <input id="cantidadentregada" type="number" placeholder="Ingrese cantidad a entregar" class="form-control mb-1" />
    <div class="form-group">      
      <select id="selectMedio" class="form-select">
        <option value="-1">Seleccione el medio de entrega</option>
        <option value="Presencial">Presencial</option>
        <option value="Domicilio">Domicilio</option>                         
      </select>   
    </div>  
    <label for="entrega">Fecha de entrega</label>
    <input id="fechaentrega" type="date" class="form-control mb-1" max="${this.hoy}">
    <input id="checkRecibe" class="form-check-input" style="margin-right: 5px" type="checkbox" /> Recibe el mismo paciente
    <input id="tipoRecibe" type="text" placeholder="Tipo" class="form-control mb-1" />
    <input id="documentoRecibe" type="text" placeholder="Documento" class="form-control mb-1" />
  </div>  
        `,
        showCancelButton: true,
        confirmButtonText: 'Entregar',
        cancelButtonText: 'Cancelar',
      }).then(async (result) => {
        if (result.isConfirmed) {

          let selectElement = document.getElementById('selectMedio') as HTMLSelectElement;
          const selectedValue = selectElement.value;
          
          let selectElementdate = document.getElementById('fechaentrega') as HTMLInputElement;         
          const selectedValueDate = selectElementdate.value;
         

          if (selectedValue !== '-1' && selectedValueDate !== '') {
            let selectElementinput = document.getElementById('cantidadentregada') as HTMLInputElement;
            const cantidadAentregar = parseInt(selectElementinput.value);
            let pendiente = itemt.cantidad - itemt.totalEntregado;
            if (cantidadAentregar > pendiente) {

              Swal.fire('Verificar!', `Ingresaste una mayor cantidad de medicamentos para entregar, que la cantidad que tiene el paciente, como pendiente`, 'error');
            } else {
              if (cantidad >= cantidadAentregar) { 
                if (cantidadAentregar > 0) {
                  if (funcionario && bodegaString) {

                    let selectElementtipo = document.getElementById('tipoRecibe') as HTMLSelectElement;
                    const selectedValuetipo = selectElementtipo.value;
                    
                    let selectElementdocumento = document.getElementById('documentoRecibe') as HTMLInputElement;         
                    const selectedValuedocumento = selectElementdocumento.value;

                 if (selectedValuetipo !== '' && selectedValuedocumento !== '') {
                    console.log("esta es la fecha para agregar el pendiente", selectedValueDate );

                    this.servicioformula.saveItemEntregaFormula(itemt.idItem, bodega, funcionario, selectedValue, cantidadAentregar, selectedValuetipo, selectedValuedocumento,selectedValueDate, this.listaregistros.idBodega)
                      .subscribe({
                        next: (data: any) => {
                          console.log(data);
                          Swal.fire('Correcto!', `Ingresado y descargado correctamente el medicamento pendiente ${itemt.medicamento.nombre}`, 'success');
                          this.buscarRegistro(this.parametro);
                        },
                        error: (err) => {
                          console.error('Error al guardar la entrega', err);
                        }
                      });
                   
                 
                    } 
                    else {
                      Swal.fire({
                        icon: 'error',
                        title: `Quien recibe!`,
                        text: 'No ha diligenciado los datos de quien recibe el medicamento pendiente prescrito en la formula número ' + itemt.idFormula + ' recuerde debe ser un mayor de edad',
                      });
                    }              
                  
                    } else {
                    Swal.fire({
                      icon: 'error',
                      title: `Verificar`,
                      text: "Usuario no esta  logueado para realizar la dispensación de medicamentos, por favor inicie sesión!",
                    });
                  }
                } else {
                  Swal.fire({
                    icon: 'error',
                    title: `Verificar`,
                    text: "La cantidad del pendiente a entregar no es valida!",
                  });
                }

              } else {
                Swal.fire('Verificar!', `La cantidad existente en la bodega es menor que la cantidad que estás intentando entregar al paciente`, 'error');
              }
            }
          } else {
            Swal.fire('Falta!', `No has seleccionado el medio de entrega y/o la fecha de entrega, para descargar el pendiente del medicamento ${itemt.medicamento.nombre}`, 'warning');
          }
        }
      });
      // Después de renderizar SweetAlert, configuramos el evento 'change' del checkbox
    document.getElementById('checkRecibe')?.addEventListener('change', (event) => this.onRecibeChange(event, itemt));
    } catch (error) {
      console.error('Error obteniendo la existencia actual:', error);
    }
  }

  onRecibeChange(event: Event, itemt: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const tipoRecibeInput = document.getElementById('tipoRecibe') as HTMLInputElement;
    const documentoRecibeInput = document.getElementById('documentoRecibe') as HTMLInputElement;

    if (isChecked) {
      if (this.CalcularEdad(this.listaregistros.paciente.fecNacimiento) > 17) {
        // Asignar valores si el paciente es mayor de 17 años
        tipoRecibeInput.value = this.listaregistros.paciente.tipoDoc;
        documentoRecibeInput.value = this.listaregistros.paciente.numDocumento;
      } else {
        // Si el paciente es menor de edad, mostrar alerta y limpiar los campos
        tipoRecibeInput.value = "";
        documentoRecibeInput.value = "";
        Swal.fire({
          icon: 'error',
          title: `Edad no permitida!`,
          text: 'El paciente no tiene la edad para recibir los medicamentos de la formula número ' + itemt.idFormula + ' por favor agregue los datos del tutor responsable',
        });
      }
    } else {
      // Limpiar los campos si se desactiva el checkbox
      tipoRecibeInput.value = "";
      documentoRecibeInput.value = "";
    }
  }

  CalcularEdad(fn: Date): number {
    if (fn !== null && fn !== undefined) {
      const convertAge = new Date(fn);
      const timeDiff = Math.abs(Date.now() - convertAge.getTime());
      let edad = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);
      if (edad) {
        return edad;
      }
    }
    return 0;
  }

  public async subsanarPendiente(itemt: any) {
    try {
      this.hoy = new Date().toISOString().split('T')[0];
      //let bodegaString = sessionStorage.getItem("bodega");
      //let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
      let bodega = this.listaregistros.idBodega;
      let funcionario = sessionStorage.getItem("nombre");
      const cantidad = await this.existenciaAcutal(itemt.medicamento.idMedicamento, bodega);
      Swal.fire({
        title: "Cancelación administrativa",
        html: `  
        <div class="swal-container">           
        <div >${itemt.medicamento.nombre}<br>Cantidad en bodega: ${cantidad}</div><br>
         <label for="entrega">Cantidad pendiente: ${itemt.cantidad - itemt.totalEntregado} </label>
        <div class="form-group">      
        <select id="selectMedio" class="form-select">
          <option value="-1">Seleccione motivo de la cancelacion de la entrega</option>
          <option value="Ajuste por presentación">Ajuste por presentación</option>   
          <option value="Agotado">Agotado</option>   
          <option value="Desabastecido">Desabastecido</option> 
          <option value="Usuario Fallecido">Usuario Fallecido</option>
          <option value="Usuario Inactivo">Usuario Inactivo</option>                          
        </select>   
         </div>         
          </div>  
        `,
        showCancelButton: true,
        confirmButtonText: 'Subsanar',
        cancelButtonText: 'Cancelar',
      }).then(async (result) => {
        if (result.isConfirmed) {
          let selectElement = document.getElementById('selectMedio') as HTMLSelectElement;
          const selectedValue = selectElement.value;
          if (selectedValue != '-1') {
            if (funcionario) {
              const cantidadAentregar = itemt.cantidad - itemt.totalEntregado;
              this.servicioformula.subsanacionItemEntregaFormula(itemt.idItem, bodega, funcionario, selectedValue, cantidadAentregar)
                .subscribe({
                  next: (data: any) => {
                    Swal.fire('Correcto!', `Ingresado y notificado correctamente por ${selectedValue},  el medicamento pendiente ${itemt.medicamento.nombre}`, 'success');
                    this.buscarRegistro(this.parametro);
                  },
                  error: (err) => {
                    console.error('Error al guardar la entrega', err);
                  }
                });


            } else {
              Swal.fire({
                icon: 'error',
                title: `Verificar`,
                text: "Usuario no esta  logueado para realizar la dispensación de medicamentos, por favor inicie sesión!",
              });
            }


          } else {

            Swal.fire('Falta!', `No has seleccionado el motivo por el que se cancelara la entrega el pendiente del medicamento ${itemt.medicamento.nombre}`, 'warning');
          }

        }
      });

    } catch (error) {
      console.error('Error obteniendo la existencia actual:', error);
    }
  }


  public existenciaAcutal(idMedicamento: number, idBodega: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.medicamentoService.getMedicamentoBodega(idMedicamento, idBodega).subscribe(
        (existencia: any) => {
          // Verifica si la existencia es nula o cero
          const cantidad = existencia && existencia.cantidad ? existencia.cantidad : 0;
          this.existencias[idMedicamento] = cantidad;
          resolve(cantidad);
        },
        (error: any) => {
          console.error('Error fetching existencia:', error);
          reject(error); // Manejar error si el servidor devuelve un error
        }
      );
    });
  }

  calcularPendiente(item: any): number {
    return item.cantidad - item.totalEntregado;
  }

  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
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


imprimir(): void {
  const contenido = this.generarContenidoPOS(this.listaregistros);
  // Crear un iframe oculto
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(`
      <html>
      <head>
        <style>
          @media print {
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 20px;
              font-weight: bold;
              margin: 2mm;
              padding: 0;
            }
            pre {
              font-size: 20px;
              line-height: 1.5;
              margin: 2mm;
              padding: 0;
            }
          }
        </style>
      </head>
      <body onload="window.print(); window.onafterprint = function() { window.close(); }">
        ${contenido}
      </body>
      </html>
    `);
    doc.close();
  }

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 3000); // Se elimina el iframe después de imprimir
}


generarContenidoPOS(formula: any): string {
  console.log(formula);
  const fechaSolicitud = new Date(formula.fecSolicitud);
  const fechaFormateada = new Intl.DateTimeFormat('es-CO', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', 
    hour12: true 
  }).format(fechaSolicitud);

  const fechaimpresion = new Date();
  const fechaimpresionFormateada = new Intl.DateTimeFormat('es-CO', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', 
    hour12: true 
  }).format(fechaimpresion);

  return `
    <pre style="font-family: Courier, monospace; font-size: 20px; font-weight: bold;">
     FORMATO DE PENDIENTES  
      SISM - SUPLYMEDICAL
       Calle 24 #18a-101
        Nro: ${formula.idFormula}
Impresión: ${fechaimpresionFormateada}

-------------------------------------
Documento: ${formula.paciente.numDocumento}  
Paciente: ${formula.paciente.pNombre} ${formula.paciente.sNombre}
          ${formula.paciente.pApellido} ${formula.paciente.sApellido}
-------------------------------------
Dispensario: Santa Marta
Funcionario: ${formula.funcionariocreaformula}
Pendiente: ${fechaFormateada}
Convenio: ${formula.paciente.eps.nombre}
-------------------------------------

  Detalle de los medicamentos
-------------------------------------
${formula.items
  .filter((med: any) => med.pendiente > 0) // Filtra solo los medicamentos con pendiente > 0
  .map((med: any, index: number) => {
    const numero = index + 1; // Enumerar medicamentos
    const nombreDividido = this.dividirEnLineas(`${numero}. ${med.medicamento.nombre}`, 35); // Divide en líneas de 40 caracteres
    return `${nombreDividido.join('\n')}
    Presentación:  ${med.medicamento.forma.nombre}
    Pendiente.  :  ${med.pendiente}`;
  })
  .join('\n')}
-------------------------------------


       
Firma    :___________________________
Documento:___________________________


Este documento es válido hasta 
90 días, para hacer su reclamo.

Si quieres saber si tu pendiente 
ya esta disponible, contactanos
através de WhatsApp 3227694532 

</pre>
  `;
}

dividirEnLineas(texto: string, maxCaracteres: number): string[] {
  const palabras = texto.split(' '); // Divide el texto en palabras
  let lineaActual = '';
  const lineas: string[] = [];

  palabras.forEach((palabra) => {
    if ((lineaActual + palabra).length > maxCaracteres) {
      lineas.push(lineaActual.trim()); // Agrega la línea actual al array
      lineaActual = palabra + ' '; // Comienza una nueva línea con la palabra actual
    } else {
      lineaActual += palabra + ' '; // Agrega la palabra a la línea actual
    }
  });

  if (lineaActual.trim().length > 0) {
    lineas.push(lineaActual.trim()); // Agrega la última línea
  }

  return lineas;
}


  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem("nivel"));  
    if (isNaN(nivelUsuario)) {
      //console.warn("El nivel del usuario no es válido o no está definido");
      return false;
    }  
    return nivelUsuario >= nivelRequerido;
  }


  eliminarRegistroEntrega(idItemEntrega: any,idMedicamento:number){

    if(this.tieneAcceso(4)){
    Swal.fire({
      title: 'Desea eliminar?',
      text: `Esta seguro de quitar el item de la entrega de este medicamento, se devolvera a su inventario la cantidad si habia sido entregado efectiva y quedara como pendiente por entregar!`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {           
 
        this.servicioformula.deleteItemFormulaEntrega(idItemEntrega.idItemEntrega ,idMedicamento).subscribe(resp => {
           Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El registro de la entrega se ha quitado en la base de datos correctamente!.`,
          });
          this.buscarRegistro(this.parametro);             
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
  else{
    Swal.fire({
    icon: 'warning',
    title: `Falta de permisos`,
    text: "No tienes permisos para realizar la modificación en la entrega de medicamentos, comunicate con el funcionario encargado!",
  });
}   
  }

}
