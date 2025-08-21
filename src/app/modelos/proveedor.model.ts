export class ProveedorI {
    id: number;
    nit: String;
    nombre: String;    
    direccion: String;
    telefono: String;
    estado: Boolean; 


    constructor() {
        this.id = NaN;
        this.nit = ""; 
        this.nombre = "";    
        this.direccion = "";      
        this.telefono = ""; 
        this.estado = true;    
      
    }

}
