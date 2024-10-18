
export class BodegaI {

    idBodega: number;
    nombre: String;
    departamento: String;
    municipio: String;
    direccion: String;
    telefono: String;
    puntoEntrega: String;
    estado: boolean;
    dispensa: boolean;
    email: String;




    constructor() {
        this.idBodega = NaN;
        this.nombre = "";
        this.departamento = "";
        this.municipio = "";
        this.direccion = "";
        this.telefono = "";
        this.puntoEntrega = "";   
        this.email = "";      
        this.estado = true;
        this.dispensa = false;

    }

}
