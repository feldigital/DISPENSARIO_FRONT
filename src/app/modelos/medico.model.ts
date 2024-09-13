export class MedicoI {
    idMedico: number;
    registroMedico: String;
    nombre: String;
    estado: Boolean; 
    especialidad: String;


    constructor() {
        this.idMedico = NaN;
        this.registroMedico = ""; 
        this.nombre = "";       
        this.estado = true;     
        this.especialidad = "";      
    }

}
