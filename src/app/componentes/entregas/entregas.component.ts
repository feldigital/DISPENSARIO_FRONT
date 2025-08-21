import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HistorialMensajeI } from 'src/app/modelos/historialMensaje';
import { MensajeI } from 'src/app/modelos/mensaje.model';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { FormulaService } from 'src/app/servicios/formula.service';
import { MedicamentoService } from 'src/app/servicios/medicamento.service';
import { PacienteService } from 'src/app/servicios/paciente.service';
import { WhatsappService } from 'src/app/servicios/whatsapp.service';
import Swal from 'sweetalert2';
//import * as QRCode from 'qrcode';

@Component({
  selector: 'app-entregas',
  templateUrl: './entregas.component.html',
  styleUrls: ['./entregas.component.css']
})
export class EntregasComponent implements OnInit, OnChanges {

  listaItemsFormula: any;
  listaregistros: any = {};
  parametro: any;
  @Input() formulaRecibida: number = NaN;
  existencias: { [key: number]: number } = {};
  hoy!: string;
  enProceso: boolean = false;
  mensajeWhat: MensajeI = new MensajeI();
  historialEnvio: HistorialMensajeI = new HistorialMensajeI();
  selectedFile: File | null = null;
  editingSoporte: boolean=false;

  constructor(
    private servicio: PacienteService,
    private medicamentoService: MedicamentoService,
    private servicioformula: FormulaService,
    private serviciobodega: BodegaService,
    private whatsappService: WhatsappService,
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
        this.listaItemsFormula = resp.items.map((item: any) => ({
          ...item,
          editing: false,
          fechaPqrs: this.formatearFechaISO(item.fechaPqrs), // Formatea la fecha individual
          canalPqrs: this.formatearCanal(item.canalPqrs), // Formatea el canal de la pqrs         
        }));

      });
  }



  public async entregarPendiente(itemt: any) {
    if (this.enProceso) {
      return; // ❌ Evita doble clic si ya está en proceso
    }

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

                      this.enProceso = true;

                      this.servicioformula.saveItemEntregaFormula(itemt.idItem, bodega, funcionario, selectedValue, cantidadAentregar, selectedValuetipo, selectedValuedocumento, selectedValueDate, this.listaregistros.idBodega)
                        .subscribe({
                          next: (data: any) => {
                            this.enProceso = false;
                            Swal.fire('Correcto!', `Ingresado y descargado correctamente el medicamento pendiente ${itemt.medicamento.nombre}`, 'success');
                            this.buscarRegistro(this.parametro);
                          },
                          error: (err) => {
                            this.enProceso = false;
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
          <option value="Usuario no adherente al tratamiento">Usuario no adherente al tratamiento</option>
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


  async imprimir(tipo: number): Promise<void> {
    const contenido = tipo === 1
      ? await this.generarContenidoPOSPendiente(this.listaregistros)
      : await this.generarContenidoPOSEntrega(this.listaregistros);
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


  async generarContenidoPOSPendiente(formula: any): Promise<string> {
    const bodega = await this.serviciobodega.getRegistroId(formula.idBodega).toPromise();
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
    //Calle 24 #18a-101
    return `
    <pre style="font-family: Courier, monospace; font-size: 20px; font-weight: bold;">
     FORMATO DE PENDIENTES  
      SISM - SUPLYMEDICAL
${bodega?.direccion}
Nro: ${formula.idFormula}
Impresión: ${fechaimpresionFormateada}

-------------------------------------
Documento:${formula.paciente.numDocumento}  
Paciente: ${formula.paciente?.pNombre ?? ''} ${formula.paciente?.sNombre ?? ''}
          ${formula.paciente?.pApellido ?? ''} ${formula.paciente?.sApellido ?? ''}
-------------------------------------
Dispensario:${bodega?.puntoEntrega}
Funcionario:${formula.funcionariocreaformula}
Pendiente:${fechaFormateada}
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
através de WhatsApp ${bodega?.telefono} 

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


  async generarContenidoPOSEntrega(formula: any): Promise<string> {
    const bodega = await this.serviciobodega.getRegistroId(formula.idBodega).toPromise();
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

    // Genera contenido QR: puedes cambiar esto a lo que desees codificar
    //const qrTexto = `Entrega fórmula N° ${formula.idFormula} - Paciente: ${formula.paciente.numDocumento}`;
    //const qrBase64 = await QRCode.toDataURL(qrTexto);

    return `
    <pre style="font-family: Courier, monospace; font-size: 20px; font-weight: bold;">
      FORMATO DE ENTREGA
      SISM - SUPLYMEDICAL
${bodega?.direccion}
Nro: ${formula.idFormula}
Impresión: ${fechaimpresionFormateada}

-------------------------------------
Documento:${formula.paciente.numDocumento}  
Paciente: ${formula.paciente?.pNombre ?? ''} ${formula.paciente?.sNombre ?? ''}
          ${formula.paciente?.pApellido ?? ''} ${formula.paciente?.sApellido ?? ''}
-------------------------------------
Dispensario:${bodega?.puntoEntrega}
Funcionario:${formula.funcionariocreaformula}
Entrega: ${fechaFormateada}
Convenio:${formula.paciente.eps.nombre}
-------------------------------------

  Detalle de los medicamentos
-------------------------------------
${formula.items
        .filter((med: any) => med.totalEntregado > 0) // Filtra solo los medicamentos con pendiente > 0
        .map((med: any, index: number) => {
          const numero = index + 1; // Enumerar medicamentos
          const nombreDividido = this.dividirEnLineas(`${numero}. ${med.medicamento.nombre}`, 35); // Divide en líneas de 40 caracteres
          return `${nombreDividido.join('\n')}
    Presentación:  ${med.medicamento.forma.nombre}
    Entregados.  : ${med.totalEntregado}`;
        })
        .join('\n')}
-------------------------------------


       
Firma    :___________________________
Documento:___________________________



Donar medicamentos,puede hacer la 
diferencia en la vida de alguien. 
Recuerde! no los deje vencer. 

</pre>

  `;   
  }




  async imprimirTirilla(): Promise<void> {
    const contenido = await this.generarContenidoPOSTirilla(this.listaregistros);

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


  async generarContenidoPOSTirilla(formula: any): Promise<string> {
    const bodega = await this.serviciobodega.getRegistroId(formula.idBodega).toPromise();
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

    const detalleMedicamentos = this.generarTextoEntrega(formula);

    return `
    <pre style="font-family: Courier, monospace; font-size: 20px; font-weight: bold;">
  FORMATO DE PREFACTURA SISM
       Nit 900018045-5      
${bodega?.direccion}
Nro: ${formula.idFormula}
Fecha: ${fechaFormateada}
-------------------------------------
Documento:${formula.paciente.numDocumento}  
Paciente: ${formula.paciente?.pNombre ?? ''} ${formula.paciente?.sNombre ?? ''}
          ${formula.paciente?.pApellido ?? ''} ${formula.paciente?.sApellido ?? ''}
-------------------------------------
Dispensario:${bodega?.puntoEntrega}
Funcionario:${formula.funcionariocreaformula}
Convenio:${formula.paciente.eps.nombre}
-------------------------------------
Detalle de (los) medicamento(s)
Cantidad Valor Uni. Valor Total  
-------------------------------------
${detalleMedicamentos}
-------------------------------------

Firma    :___________________________
Documento:___________________________

</pre>
  `;
  }

  private generarTextoEntrega(formula: any): string {
    let total = 0;

    const resultado = formula.items
      .filter((med: any) => med.totalEntregado > 0)
      .map((med: any) => {
        const valorUnitario = med.importe / med.cantidad;
        const subTotal = valorUnitario * med.totalEntregado;
        total += subTotal;

        const nombreDividido = this.dividirEnLineas(
          `${med.medicamento.nombre}`,
          35
        );

        const valorUnitarioFormateado = valorUnitario.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 2
        });

        const subTotalFormateado = subTotal.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 2
        });

        // Alinear cada columna usando padStart
        const cantidadStr = med.totalEntregado.toString().padStart(3, ' ');
        const valorUnitarioStr = valorUnitarioFormateado.padStart(12, ' ');
        const subTotalStr = subTotalFormateado.padStart(15, ' ');

        return `${nombreDividido.join('')}\n${cantidadStr} ${valorUnitarioStr} ${subTotalStr}`;
      })
      .join('\n\n');

    const totalFormateado = total.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    });

    return `${resultado}\n\n     TOTAL: ${totalFormateado}`;
  }


  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem("nivel"));
    if (isNaN(nivelUsuario)) {
      //console.warn("El nivel del usuario no es válido o no está definido");
      return false;
    }
    return nivelUsuario >= nivelRequerido;
  }


  eliminarRegistroEntrega(idItemEntrega: any, idMedicamento: number) {

    if (this.tieneAcceso(2)) {
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

          this.servicioformula.deleteItemFormulaEntrega(idItemEntrega.idItemEntrega, idMedicamento).subscribe(resp => {
            Swal.fire({
              icon: 'success',
              title: `Ok`,
              text: `El registro de la entrega se ha quitado en la base de datos correctamente!, y le fue devuelta a su inventario si era una entrega efectiva.`,
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
    else {
      Swal.fire({
        icon: 'warning',
        title: `Falta de permisos`,
        text: "No tienes permisos para realizar la modificación en la entrega de medicamentos, comunicate con el funcionario encargado!",
      });
    }
  }

  public editFormula(mensajeTitle: string) {
    this.servicioformula.update(this.listaregistros).subscribe(resp => {
      Swal.fire({
        icon: 'success',
        title: 'Ok',
        text: mensajeTitle,
      });
    },
      err => {
        // Swal.fire({
        //   icon: 'error',
        //   title: 'Error...',
        //   text: 'No se pudo guardar la formula en la base de datos!',
        //   footer: err.mensaje
        //      })
        Swal.fire({
          icon: 'success',
          title: 'Ok',
          text: mensajeTitle,
        });

      }
    );
  }



  public editarPqrs(itemt: any) {
    this.listaItemsFormula.forEach((p: any) => p.editing = false);
    itemt.editing = true;


  }
  public cancelEdicion(itemt: any) {
    itemt.editing = false;
  }

  formatearFechaISO(fecha: string | Date | null): string {
    if (!fecha) {
      return '';
    }
    const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    // Formato YYYY-MM-DD
    return dateObj.toISOString().split('T')[0];
  }

  formatearCanal(valor: any): string {
    return (typeof valor === 'string' && valor !== null) ? valor.trim() : '';
  }

  aplicarPQRSATodos(itemt: any) {
    if (!itemt.canalPqrs || !itemt.fechaPqrs) {
      Swal.fire('Campos incompletos', 'Por favor complete todos los campos antes de guardar.', 'warning');
      return;
    }

    // Validar que la fecha de vencimiento no sea menor a la fecha actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Eliminar hora para comparar solo fecha
    const fechaPqrsDigitada = new Date(itemt.fechaPqrs);
    fechaPqrsDigitada.setHours(0, 0, 0, 0);

    if (fechaPqrsDigitada > hoy) {
      Swal.fire('Fecha de la PQRS inválida', 'La fecha de la PQRS no puede ser mayor a la fecha actual.', 'error');
      return;
    }

    // ✅ Actualizar directamente sobre los objetos existentes
    this.listaItemsFormula.forEach((item: { canalPqrs: any; fechaPqrs: any; }) => {
      item.canalPqrs = itemt.canalPqrs;
      item.fechaPqrs = itemt.fechaPqrs;
    });
    itemt.editing = false;
    this.listaregistros.items = this.listaregistros.items.map((item: any) => ({
      ...item,
      itemsEntrega: [], // Anular entregas
    }));
    this.editFormula("La PQRS se asigno exitosamente a todos los medicamentos de la formula")
    //Swal.fire({
    //         icon: 'success',
    //         title: 'PQRS ingresada a toda la Formula',
    //         text: `La PQRS se asigno exitosamente a todos los medicamentos de la formula, recuerde actualizar la formula para que el cambio persista en base de datos`,
    //       });

  }

  aplicarPQRS(itemt: any) {
    if (!itemt.canalPqrs || !itemt.fechaPqrs) {
      Swal.fire('Campos incompletos', 'Por favor complete todos los campos antes de guardar.', 'warning');
      return;
    }

    // Validar que la fecha de vencimiento no sea menor a la fecha actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Eliminar hora para comparar solo fecha
    const fechaPqrsDigitada = new Date(itemt.fechaPqrs);
    fechaPqrsDigitada.setHours(0, 0, 0, 0);

    if (fechaPqrsDigitada > hoy) {
      Swal.fire('Fecha de la PQRS inválida', 'La fecha de la PQRS no puede ser mayor a la fecha actual.', 'error');
      return;
    }

    itemt.editing = false;
    this.listaregistros.items = this.listaregistros.items.map((item: any) => ({
      ...item,
      itemsEntrega: [], // Anular entregas
    }));
    this.editFormula("La PQRS se asigno exitosamente al medicamento")
    //Swal.fire({
    //         icon: 'success',
    //         title: 'PQRS ingresada',
    //         text: `La PQRS se asigno exitosamente al medicamento, recuerde actualizar la formula para que el cambio persista en base de datos`,
    //       });
    //console.log(this.listaregistros);

  }



  async enviarWhatsApp(itemFormula: any) {
    const paciente = this.listaregistros.paciente;
    let celular = (paciente?.celularPrincipal || '').replace(/\s/g, '');
    if (!this.celularValido(celular)) {
      Swal.fire('Error', '❌ El número de celular principal del paciente ' + paciente?.celularPrincipal + ',  no es válido para enviar el mensaje!', 'error');
      return;
    }
    const bodega = await this.serviciobodega.getRegistroId(this.listaregistros.idBodega).toPromise();    
    let funcionario = sessionStorage.getItem("nombre");
    const textomensaje = "Hola *" + paciente.pNombre + "*! \n" + bodega?.nombre + " te informa que el pendiente Nro. *" + this.listaregistros.idFormula + "* de tu medicamento. \n💊" + itemFormula.medicamento.nombre + " \nYa se encuentra disponible para que lo puedas recoger, en tu punto de entrega. \nRecuerde que debe traer su volante de pendiente. \n\n*POR FAVOR NO RESPONDER ESTE MENSAJE*";
    Swal.fire({
      title: '¿Enviar mensaje?',
      html: `
      <p><strong>Número:</strong> ${paciente?.celularPrincipal}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${textomensaje}</p>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, enviar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mensajeWhat.phone = "57" + celular;
        this.mensajeWhat.message = textomensaje;     

          this.whatsappService.enviarMensaje(this.mensajeWhat).subscribe(
            (resp: any) => {
              Swal.fire('📤 Mensaje enviado', '', 'success');
              this.historialEnvio.itemFormula_id = itemFormula.idItem;
              this.historialEnvio.celularEnvio = celular;
              this.historialEnvio.funcionarioEnvio = funcionario!;
              this.historialEnvio.fechaEnvio = new Date();

              this.servicioformula.guardarMensaje(this.historialEnvio).subscribe(() => {
                // Aquí ya terminó guardarMensaje
                this.buscarRegistro(this.listaregistros.idFormula);
              });
            },
            (err: any) => {
              Swal.fire('❌ Error al enviar el mensaje', err.message || 'Error desconocido', 'error');
              console.error(err);
            });        
      }
    });

  }

  async enviarWhatsApp2(itemFormula: any) {

    const paciente = this.listaregistros.paciente;
    let celular = (paciente?.celularSecundario || '').replace(/\s/g, '');
    if (!this.celularValido(celular)) {
      Swal.fire('Error', '❌ El número de celular secundario del paciente ' + paciente?.celularSecundario + ',  no es válido para enviar el mensaje!', 'error');
      return;
    }
    const bodega = await this.serviciobodega.getRegistroId(this.listaregistros.idBodega).toPromise();
    let funcionario = sessionStorage.getItem("nombre");
    const textomensaje = "Hola *" + paciente.pNombre + "*! \n" + bodega?.nombre + " te informa que el pendiente Nro. *" + this.listaregistros.idFormula + "* de tu medicamento. \n💊" + itemFormula.medicamento.nombre + " \nYa se encuentra disponible para que lo puedas recoger, en tu punto de entrega. \nRecuerde que debe traer su volante de pendiente. \n\n*POR FAVOR NO RESPONDER ESTE MENSAJE*";
    Swal.fire({
      title: '¿Enviar mensaje?',
      html: `
      <p><strong>Número:</strong> ${paciente?.celularSecundario}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${textomensaje}</p>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, enviar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mensajeWhat.phone = "57" + celular;
        this.mensajeWhat.message = textomensaje;


        this.whatsappService.enviarMensaje(this.mensajeWhat).subscribe(
          (resp: any) => {
            Swal.fire('📤 Mensaje enviado', '', 'success');
            this.historialEnvio.itemFormula_id = itemFormula.idItem;
            this.historialEnvio.celularEnvio = celular;
            this.historialEnvio.funcionarioEnvio = funcionario!;
            this.historialEnvio.fechaEnvio = new Date();

            this.servicioformula.guardarMensaje(this.historialEnvio).subscribe(() => {
              // Aquí ya terminó guardarMensaje
              this.buscarRegistro(this.listaregistros.idFormula);
            });
          },
          (err: any) => {
            Swal.fire('❌ Error al enviar el mensaje', err.message || 'Error desconocido', 'error');
            console.error(err);
          });

      }
    });

  }



  async vermensajeWhatsApp(itemFormula: any) {
    const bodega = await this.serviciobodega.getRegistroId(this.listaregistros.idBodega).toPromise();
    const paciente = this.listaregistros.paciente;
    let funcionario = sessionStorage.getItem("nombre");
    const textomensaje = "Hola *" + paciente.pNombre + "*! \n" + bodega?.nombre + " te informa que el pendiente Nro. *" + this.listaregistros.idFormula + "* de tu medicamento. \n💊" + itemFormula.medicamento.nombre + " \nYa se encuentra disponible para que lo puedas recoger, en tu punto de entrega. \nRecuerde que debe traer su volante de pendiente. \n\n*POR FAVOR NO RESPONDER ESTE MENSAJE*";
    const { value: formValues } = await Swal.fire({
      title: 'Editar y enviar WhatsApp',
      html: `
                  <label style="display:block; text-align:left;">Mensaje:</label>
                  <textarea id="mensaje" placeholder="Mensaje a enviar"
                  style="width: 100%; height: 180px; padding: 10px; resize: vertical; font-size: 14px;">${textomensaje}</textarea>
                  <label style="display:block; margin-top:10px; text-align:left;">Número celular:</label>
                  <input id="telefono" class="swal2-input" placeholder="Número celular" value="${paciente?.celularPrincipal || ''}">
                `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const mensaje = (document.getElementById('mensaje') as HTMLTextAreaElement).value;
        const telefono = (document.getElementById('telefono') as HTMLInputElement).value;
        if (!mensaje || !telefono) {
          Swal.showValidationMessage('Ninguno de los campos debe ser vacio');
          return null;
        }
        return { mensaje, telefono };
      }
    });

    if (formValues) {
      const confirmacion = await Swal.fire({
        title: '¿Enviar mensaje?',
        html: `
                    <p><strong>Número:</strong> ${formValues.telefono}</p>
                    <p><strong>Mensaje:</strong></p>
                    <p>${formValues.mensaje}</p>
                  `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'No, cancelar'
      });

      if (confirmacion.isConfirmed) {

        const textomensaje = formValues.mensaje;
        this.mensajeWhat.phone = "57" + formValues.telefono;
        this.mensajeWhat.message = textomensaje;
        if (this.celularValido(formValues.telefono)) {
          this.whatsappService.enviarMensaje(this.mensajeWhat).subscribe(
            (resp: any) => {
              Swal.fire('📤 Mensaje enviado', '', 'success');

              this.historialEnvio.itemFormula_id = itemFormula.idItem;
              this.historialEnvio.celularEnvio = formValues.telefono;
              this.historialEnvio.funcionarioEnvio = funcionario!;
              this.historialEnvio.fechaEnvio = new Date();

              this.servicioformula.guardarMensaje(this.historialEnvio).subscribe(() => {
                // Aquí ya terminó guardarMensaje
                this.buscarRegistro(this.listaregistros.idFormula);
              });


            },
            (err: any) => {
              Swal.fire('❌ Error al enviar el mensaje', err.message || 'Error desconocido', 'error');
              console.error(err);
            }
          );
        }
        else {
          Swal.fire('Celular invalido', 'El numero de celular ' + formValues.telefono + ' no es valido para realizar el envio del mensaje.', 'error');
        }
      } else {
        Swal.fire('❌ Envío cancelado', '', 'info');
      }
    }
  }

  celularValido(celular: string): boolean {
    // Validar que tenga exactamente 10 dígitos, empiece por "3" y solo números
    return /^[3][0-9]{9}$/.test(celular);
  }

  async historialEnvios(itemFormula: any) {

    const paciente = this.listaregistros.paciente;
    // Validar si no hay mensajes enviados
    if (!itemFormula.itemsMensaje || itemFormula.itemsMensaje.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin mensajes enviados',
        text: `El paciente ${paciente.pNombre ?? ''} ${paciente.sNombre ?? ''} ${paciente.pApellido ?? ''} ${paciente.sApellido ?? ''} no tiene mensajes enviados, asociados al pendiente Nro. ${this.listaregistros.idFormula} del medicamento 💊 ${itemFormula.medicamento.nombre}.`,
        confirmButtonText: 'Entendido'
      });
      return; // Salir de la función
    }

    const bodega = await this.serviciobodega.getRegistroId(this.listaregistros.idBodega).toPromise();
    // Tu mensaje predefinido

    const textomensaje = "Hola *" + paciente.pNombre + "*! \n" + bodega?.nombre + " te informa que el pendiente Nro. *" + this.listaregistros.idFormula + "* de tu medicamento. \n💊" + itemFormula.medicamento.nombre + " \nYa se encuentra disponible para que lo puedas recoger, en tu punto de entrega. \nRecuerde que debe traer su volante de pendiente. \n\n*POR FAVOR NO RESPONDER ESTE MENSAJE*";
    // Generar el HTML de la lista
    const listaTelefonosHTML = itemFormula.itemsMensaje
      .map((item: { fechaEnvio: string | number | Date; celularEnvio: any; funcionarioEnvio: any; }) => {
        const fecha = new Date(item.fechaEnvio).toLocaleString('es-CO', {
          dateStyle: 'short',
          timeStyle: 'short'
        });
        return `
      <li class="list-group-item py-1">
        <strong>${item.celularEnvio}</strong><br>
        <small>${fecha} - ${item.funcionarioEnvio}</small>
      </li>
    `;
      })
      .join('');

    // Mostrar el Swal
    Swal.fire({
      title: '<h5 class="mb-3 fw-bold text-primary">Historial de mensajes</h5>',
      html: `
    <div class="d-flex gap-3" style="align-items: flex-start;">
      
      <!-- Lista de teléfonos -->
      <div class="form-group text-start" style="flex: 1;">
        <label class="form-label fw-bold">Datos del envío </label>
        <ul class="list-group list-group-sm">
          ${listaTelefonosHTML}
        </ul>
      </div>

      <!-- Mensaje predefinido -->
      <div class="form-group text-start" style="flex: 1;">
        <label class="form-label fw-bold">Mensaje enviado</label>
        <div class="border rounded p-2 bg-light" style="white-space: pre-wrap;">
          ${textomensaje}
        </div>
      </div>

    </div>
  `,
      showConfirmButton: false,
      showCloseButton: true,
      width: '700px'
    });

  }



    onFileSelected(event: any) {
      this.selectedFile = event.target.files[0];
  
      if (!this.selectedFile) {
      return;
    }
  
    // Validar que sea PDF
    const isPdf = this.selectedFile.type === 'application/pdf' || this.selectedFile.name.toLowerCase().endsWith('.pdf');
  
    if (!isPdf) {
       Swal.fire({
            icon: 'warning',
            title: 'ERROR PDF ',
            text: '❌ Solo se permiten archivos PDF como soporte de la formula',
          });
      
      event.target.value = ''; // Limpiar selección del input
       this.selectedFile =null;
      return;
    }
  
  
  
    if(this.listaregistros.urlFormula){
    Swal.fire({
        title: 'Reemplazar el Soporte',
        text: 'Esta seguro de reemplzar el soporte existente de la formula por este otro, este cambio ya no se podra reversar',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Si, reemplazar!'
      }).then((result) => {
        if (result.isConfirmed) {
  
         this.onUpload();
         
          
        }
      });
  
    }
    else{
  
    this.onUpload();
    } 
    }
  
    onUpload() {
    if (!this.selectedFile) {
       Swal.fire({
            icon: 'info',
            title: 'Pendiente',
            text: `No se ha seleccionado el soporte en DPF de la fórmula Nro. ${this.listaregistros.idFormula}. para ser cargada a la nube`,
          });
          return;
    }
  
       this.servicioformula.subirFormula(this.selectedFile, this.listaregistros.idFormula).subscribe({
        next: (resp: string) => {
          this.listaregistros.urlFormula = resp;
          this.editingSoporte = false;
          Swal.fire({
            icon: 'success',
            title: 'Ok',
            text: `El soporte de la fórmula Nro. ${this.listaregistros.idFormula} fue cargado correctamenteen el bucket S3 ${resp}`,
          });
        },
        error: (err) => {
          console.error("❌ Error al subir:", err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error al cargar el soporte de la fórmula Nro. ${this.listaregistros.idFormula}.`,
          });
        }
      });
    
  }
  
  verArchivo() {
    // Si la URL es pública o accesible, se abre en nueva pestaña
    window.open(this.listaregistros.urlFormula, '_blank');
  }
  
    public editarSoporte() {     
      this.editingSoporte = true;
  
  
    }
    public cancelSoporte() {
       this.editingSoporte = false;
    }


}
