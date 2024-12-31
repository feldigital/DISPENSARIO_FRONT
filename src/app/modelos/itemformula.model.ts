import { MedicamentoI } from './medicamento.model';
import { ItemFormulaEntregaI } from './itemformulaentrega.model';

export class ItemFormulaI {
  medicamento!: MedicamentoI;
  cantidad: number = 1;
  importe: number=0.0;
  frecuencia:string="1 Cada 24 Horas";
	duracion:string="0";
  habilitarCantidad:boolean=false;

  items: Array<ItemFormulaEntregaI> = [];

  public calcularImporte(): number {
    return this.cantidad * this.medicamento.valor;
  }

  
  calcularTotalEntregado(): number {
    var total = 0;
    this.items.forEach((item: ItemFormulaEntregaI) => {
      total += item.cantidadEntregada;
    });
    return total;
  }
}
