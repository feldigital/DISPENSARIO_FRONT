export class PacienteI {
    idPaciente: number;
    tipoDoc: String;
    numDocumento: String;
    pApellido: String;
    sApellido: String;
    pNombre: String;
    sNombre: String;
    fecNacimiento: Date;
    sexo: String;
    zona: String;
    barrio: String;
    direccion: String;
    celularPrincipal: String;
    celularSecundario: String;
    email: String;
    eps: String;
    regimen: String;
    tipoAfiliado: String;
    categoria: String;
    tipoPoblacion: String;
    categoriaSisben: String;
    dispensario: String;
    departamento: String;
    municipio: String;

    pave: Boolean;
    estado: Boolean;
    portabilidad: Boolean;
    dptoportabilidad: String;
    mpoportabilidad: String;
    fecVencePortabilidad: Date | null;



    constructor() {
        this.idPaciente = NaN;
        this.tipoDoc= "";
        this.numDocumento= "";
        this.pApellido= "";
        this.sApellido= "";
        this.pNombre= "";
        this.sNombre= "";
        this.fecNacimiento= new Date();
        this.sexo= "";
        this.zona= "";
        this.barrio= "";
        this.direccion= "";
        this.celularPrincipal= "";
        this.celularSecundario= "";
        this.email= "";
        this.eps= "";
        this.regimen= "";
        this.tipoAfiliado= "";
        this.categoria= "";
        this.tipoPoblacion= "";
        this.categoriaSisben= "";
        this.departamento= "";
        this.municipio= "";
        this.pave = false;
        this.estado = true;
        this.dispensario="";
        this.portabilidad = false;
        this.dptoportabilidad= "";
        this.mpoportabilidad= "";
        this.fecVencePortabilidad=null;

    }

}
