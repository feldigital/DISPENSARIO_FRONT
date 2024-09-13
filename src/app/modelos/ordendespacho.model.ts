import { ItemOrdenDespachoI } from './ItemOrdenDespacho.model';

export class OrdenDespachoI {
    idDespacho: number;
    fechaDespacho: Date;
    fechaEntradaDestino: Date | null; // Permitir que sea null
    funcionarioDespacho: string;
    funcionarioEntradaDestino: string;
    estado: string;
    bodegaOrigen: number;
    bodegaDestino: number;
    observacion: string;
    itemsDespacho: Array<ItemOrdenDespachoI> = [];

    constructor() {
        this.idDespacho = NaN;
        this.fechaDespacho = new Date();
        this.fechaEntradaDestino = null; // Deja la fecha como null
        this.bodegaOrigen = NaN;
        this.bodegaDestino = NaN;
        this.observacion = "";
        this.funcionarioDespacho = "";
        this.funcionarioEntradaDestino = "";
        this.estado = "Creación";      
    }

}
