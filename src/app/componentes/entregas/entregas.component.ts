import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormulaI } from 'src/app/modelos/formula.model';
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
  listaregistros: any;
  parametro: any;
  @Input() formulaRecibida: number = NaN;
  existencias: { [key: number]: number } = {};

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
        console.log(resp);
        this.listaItemsFormula = resp.items;
        console.log(this.listaItemsFormula);
        // this.listaItemsFormula.sort((a: any, b: any) => b.idFormula - a.idFormula);
      });
  }

  public async entregarPendiente(itemt: any) {
    try {
      let bodegaString = sessionStorage.getItem("bodega");
      let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
      let funcionario= sessionStorage.getItem("nombre"); 
      const cantidad = await this.existenciaAcutal(itemt.medicamento.idMedicamento, bodega);  
      Swal.fire({
        title: "Entrega de pendiente",
        html: `             
        <div>${itemt.medicamento.nombre}<br><br>Cantidad en bodega: ${cantidad}</div>
        <input id="cantidadentregada" type="number" placeholder="Ingrese cantidad a entregar" class="swal2-input"> 
        <select id="selectMedio" class="form-select">
          <option value="-1">Seleccione el medio de entrega</option>
          <option value="Presencial">Presencial</option>
          <option value="Domicilio">Domicilio</option>               
        </select>     
        `,
        showCancelButton: true,
        confirmButtonText: 'Entregar',
        cancelButtonText: 'Cancelar',
      }).then(async (result) => {
        if (result.isConfirmed) {

          let selectElement = document.getElementById('selectMedio') as HTMLSelectElement;
          let selectElementinput = document.getElementById('cantidadentregada') as HTMLInputElement;
          const selectedValue = selectElement.value;
          if (selectedValue !== '-1') {
            const cantidadAentregar = parseInt(selectElementinput.value);
            let pendiente = itemt.cantidad - itemt.totalEntregado;
            if (cantidadAentregar > pendiente) {

              Swal.fire('Verificar!', `Ingresaste una mayor cantidad de medicamentos para entregar, que la cantidad que tiene el paciente, como pendiente`, 'error');
            } else {
              if (cantidad >= cantidadAentregar) {
                if (cantidadAentregar>0){
                if (funcionario && bodegaString){
                this.servicioformula.saveItemEntregaFormula(itemt.idItem, bodega, funcionario, selectedValue, cantidadAentregar)
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
                  }else{
                    Swal.fire({
                      icon: 'error',
                      title: `Verificar`,
                      text: "Usuario no esta  logueado para realizar la dispensación de medicamentos, por favor inicie sesión!",
                    });
                  }
                }else{
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
            Swal.fire('Falta!', `No has seleccionado el medio de entrega, para descargar el pendiente del medicamento ${itemt.medicamento.nombre}`, 'warning');
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

}
