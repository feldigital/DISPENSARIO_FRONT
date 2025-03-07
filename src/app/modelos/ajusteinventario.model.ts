import { ItemAjusteInventarioI } from './itemajusteinventario.model';

export class AjusteInventarioI {
    idAjuste: number;
    fechaAjuste: Date;
    fechaInventario: Date | null; // Permitir que sea null
    funcionarioAjuste: string;
    funcionarioInventario: string;
    estado: string;
    bodegaAjuste: number;    
    observacionAjuste: string;   
    
    itemsAjuste: Array<ItemAjusteInventarioI> = [];

    constructor() {
        this.idAjuste = NaN;
        this.fechaAjuste = new Date();
        this.fechaInventario = new Date();
        this.bodegaAjuste = NaN;        
        this.observacionAjuste = "";
        this.funcionarioAjuste = "";
        this.funcionarioInventario = "";
        this.estado = "Pendiente";   
          
    }

}
