
export class ItemOrdenDespachoI {
	
  medicamento: number;
  cantidad: number;  
  invima:string;
  laboratorio:string;
  lote:string;
  fechaVencimiento:Date;
  estadoEntradaBodega :boolean;

  constructor() {
    this.medicamento = NaN;
    this.cantidad = NaN;
    this.fechaVencimiento = new Date();   
    this.lote = "";
    this.laboratorio = "";
    this.invima = "";
    this.estadoEntradaBodega = false;   
}

}
