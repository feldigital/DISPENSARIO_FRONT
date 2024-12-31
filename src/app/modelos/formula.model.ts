import { IpsI } from './ips.model';
import { ItemFormulaI } from './itemformula.model';
import { MedicoI } from './medico.model';
import { PacienteI } from './paciente.model';


export class FormulaI {
  idFormula: number;
  nroFormula: string;
  observacion: string;
  ips: IpsI;
  medico: MedicoI;
  fecPrescribe: Date;
  fecSolicitud: Date | null;
  items: Array<ItemFormulaI> = [];
  paciente: PacienteI;
  total: number;
  estado: boolean;
  cieP:string;
  cieR1:string;
  cieR2:string;  
  cieR3:string;  
  cobroCM: boolean;
  valorCM: number;
  continuidad:string;  
  origenurgencia:boolean;
  pgp:boolean;
  programa: string;
  idBodega: number;
  fecIngreso: Date;
  estadoanulada: boolean;
  funcionariocreaformula: string;
  
  constructor() {
    this.idFormula = NaN;
    this.nroFormula = "";  
    this.observacion = "";  
    this.ips = new IpsI();  
    this.medico = new MedicoI();  
    this.fecPrescribe = new Date();  
    this.fecSolicitud = new Date();  
    this.paciente = new PacienteI();  
    this.fecIngreso = new Date();  
    this.total = NaN;
    this.estado = false;
    this.cieP = ""; 
    this.cieR1 = ""; 
    this.cieR2 = ""; 
    this.cieR3 = ""; 
    this.cobroCM = false;
    this.valorCM = NaN;
    this.continuidad = "";
    this.origenurgencia=false;
    this.pgp = false;
    this.programa="";
    this.idBodega = NaN;
    this.estadoanulada = false;
    this.funcionariocreaformula="";
}

  calcularGranTotal(): number {
    this.total = 0;
    this.items.forEach((item: ItemFormulaI) => {
      this.total += item.calcularImporte();
    });
    return this.total;
  }

}
