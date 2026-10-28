import { IpsI } from './ips.model';
import { MedicoI } from './medico.model';
import { PacienteI } from './paciente.model';


export class FormulaDevolucionI {
    id: number;
    observacion: String;
    ips: IpsI;
    medico: MedicoI;
    fecPrescribe: Date;
    fecSolicitud: Date | null;
    paciente: PacienteI;
    idBodega: number;
    fecIngreso: Date;
    funcionariocreaformula: string;
    codEps: string;
    regimen: string;
    categoria: string;
    urlFormula: string | null;
    causasDevolucion: number[];
    otraCausa: string;




    constructor() {
        this.id = NaN;
        this.observacion = "";
        this.ips = new IpsI();
        this.medico = new MedicoI();
        this.fecPrescribe = new Date();
        this.fecSolicitud = new Date();
        this.paciente = new PacienteI();
        this.fecIngreso = new Date();
        this.idBodega = NaN;
        this.funcionariocreaformula = "";
        this.codEps = "";
        this.regimen = "";
        this.categoria = "";
        this.urlFormula = null;
        this.otraCausa = "";
        this.causasDevolucion=[];
    }


}
