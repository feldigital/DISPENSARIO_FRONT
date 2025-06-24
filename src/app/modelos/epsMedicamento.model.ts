export class EpsMedicamentoI {
    id: number;
    idMedicamento: number;
    codEps: String;
    valorVenta: number;
    descuento: number;
    


    constructor() {
        this.id = NaN;
        this.idMedicamento = NaN;        
        this.codEps = "";  
        this.valorVenta=0.0; 
        this.descuento=0.0;              
    }

}
