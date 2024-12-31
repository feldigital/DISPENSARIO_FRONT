import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
        console.log(this.listaregistros);
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
                    this.servicioformula.saveItemEntregaFormula(itemt.idItem, bodega, funcionario, selectedValue, cantidadAentregar, selectedValuetipo, selectedValuedocumento,selectedValueDate)
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
    
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(this.generarContenidoPOS( this.listaregistros));
        ventana.print();
        ventana.close();
      }
   
  }

  generarContenidoPOS(formula: any): string {
    console.log(formula);

    // Configurar los anchos de columna
    const anchoCodigo = 4; // Ancho fijo para el código
    const anchoDescripcion = 20; // Ancho máximo para la descripción
    const anchoUnidad = 4; // Ancho fijo para la unidad
    const anchoCantidad = 4; // Ancho fijo para la cantidad
  
    // Helper para centrar texto en una columna
    const centrarTexto = (texto: string, ancho: number): string => {
      const padding = Math.max(0, (ancho - texto.length) / 2);
      return ' '.repeat(Math.floor(padding)) + texto + ' '.repeat(Math.ceil(padding));
    };
  
    // Helper para dividir el texto en líneas si excede el ancho
    const dividirTexto = (texto: string, ancho: number): string[] => {
      const lineas = [];
      while (texto.length > ancho) {
        lineas.push(texto.substring(0, ancho));
        texto = texto.substring(ancho);
      }
      if (texto.length > 0) {
        lineas.push(texto);
      }
      return lineas;
    };
  
    // Formatear cada ítem
    const detallesMedicamentos = formula.items.map((med: any) => {
      const codigo = centrarTexto(med.medicamento.idMedicamento || '', anchoCodigo);
      const descripcionLineas = dividirTexto(med.medicamento.nombre, anchoDescripcion);
      const unidad = centrarTexto(med.medicamento.forma.nombre || '', anchoUnidad);
      const cantidad = centrarTexto(med.cantidad.toString(), anchoCantidad);
  
      // Combinar líneas, ajustando el formato
      return descripcionLineas
        .map((linea, index) =>
          index === 0
            ? `${codigo}${linea.padEnd(anchoDescripcion)}${unidad}${cantidad}`
            : `      ${linea.padEnd(anchoDescripcion)}      ` // Dejar columnas vacías para líneas adicionales
        )
        .join('\n');
    });
  
    // Generar el contenido final
    return `
      <pre style="font-family: Courier, monospace; font-size: 14px;">
      
          DOCUMENTO SUMINISTRO 
           DE PRODUCTOS SISM
            NIT: 900018045
      ==========================
      Nro. Solicitud:${formula.idFormula}
      Documento:${formula.paciente.numDocumento}  
      Paciente: ${formula.paciente.pNombre} ${formula.paciente.sNombre}
                ${formula.paciente.pApellido} ${formula.paciente.sApellido}
      Num de entrega:${formula.continuidad}
      Médico: ${formula.medico.nombre}
  
      --------------------------
      Local: Dispensario Santa Catalina
      Funcionario: ${formula.funcionariocreaformula}
      Fecha: ${formula.fecSolicitud}
      Convenio: ${formula.paciente.eps.nombre}
  
      Detalle de la dispensación
      ---------------------------------
      ID.  Descripción      Unid. Cant.
      ---------------------------------
      ${detallesMedicamentos.join('\n')}
      --------------------------
  
      Cuota moderadora:  ${formula.paciente.categoria.valor}
      Recibi a conformidad los productos
  
      _________________________________
      Firma
      Documento
      </pre>
    `;

/*
    return `
      <pre style="font-size: 14px;">
      
          DOCUMENTO SUMINISTRO 
           DE PRODUCTOS SISM
            NIT: 900018045
      ==========================
      Nro. Solicitud:${formula.idFormula}
      Documento:${formula.paciente.numDocumento}  
      Paciente: ${formula.paciente.pNombre} ${formula.paciente.sNombre}
                ${formula.paciente.pApellido} ${formula.paciente.sApellido}
      Num de entrega:${formula.continuidad}
      Médico: ${formula.medico.nombre}

      --------------------------
      Local: Dispensario Santa Catalina
      Funcionario: ${formula.funcionariocreaformula}
      Fecha: ${formula.fecSolicitud}
      Convenio: ${formula.paciente.eps.nombre}

      Detalle de la dispensación
      --------------------------
      Cod.   Descripción  Unid.  Cant.
      --------------------------
      ${formula.items.map((med: any) =>
        `- ${med.medicamento.nombre}:
          Unid.: ${med.medicamento.forma.nombre}
          Cant.: ${med.cantidad}       
        `).join('\n')}
      --------------------------

      Cuota moderadora:  ${formula.paciente.categoria.valor}
      Recibi a conformidad los productos

      _________________________________
      Firma
      Documento
      </pre>
    `;
    */
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
