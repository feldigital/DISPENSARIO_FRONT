
export class MedicamentoI {
    idMedicamento: number;
    nombre: String;
    principioActivo: String;
    codigoCum: String;
    codigoAtc: String;
    concentracion: String;
    valor: number;
    descuento:number ;
    codigoBarra: String;
    fecCreacion: Date;
    estado: Boolean;
    via: number;
    forma: number;



    constructor() {
        this.idMedicamento = NaN;
        this.nombre = "";
        this.principioActivo="";
        this.codigoCum="";
        this.codigoAtc="";
        this.concentracion="";
        this.valor= NaN;
        this.descuento= NaN ;
        this.codigoBarra="";
        this.fecCreacion=new Date();
        this.estado=true;
        this.via= NaN;
        this.forma= NaN;
        this.estado = true;

    }

}
