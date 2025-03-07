
import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/servicios/auth.service';
import { BodegaService } from 'src/app/servicios/bodega.service';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {  
  
  mobileQuery: MediaQueryList;
  isLoggedIn: boolean = false;
  funcionario!:string;
  bodegaActual:any;

  fillerNav=[
  //  {name:"Inicio",route:"login",icon:"home"},
    {name:"Paciente",route:"paciente",icon:"perm_identity",nivel:3},
    { name:"Medicamentos",
      route:"medicamento",
      icon:"hdr_weak", nivel:3,
      menu:"medicamentosMenu", 
       subNav: [
        { name: 'Consulta', route: '/menu/medicamento', icon: 'search' },
        { name: 'Registro', route: '/menu/medicamento/register', icon: 'add' }
      ]},

    
    {name:"Dispensar Formula",route:"formula",icon:"playlist_add",nivel:2},
    {name:"Editar Formula",route:"editformula",icon:"edit",nivel:4},   
    {name:"Bodegas",route:"bodega",icon:"domain",nivel:2},   
    {name:"Existencias",route:"existencias",icon:"playlist_add_check",nivel:2},   
    {name:"Pendientes",route:"pendiente",icon:"remove_circle_outline",nivel:2},   
    {name:"Medicamentos bodega",route:"medicamentobodega",icon:"filter_tilt_shift",nivel:2}, 
    //{name:"Medicamentos no rotan",route:"norotan",icon:"query_builder",nivel:3}, 
    {name:"Medicamento entregado",route:"entregados",icon:"check_circle_outline",nivel:2}, 
    {name:"Ordenes",route:"despacho",icon:"input",nivel:2},    
    {name:"Trazabilidad de Medicamento",route:"trazamedicamento",icon:"shuffle",nivel:2},
    {name:"Ajuste por inventario",route:"ajusteinventario",icon:"compare_arrows",nivel:2}, 
    {name:"Historial de entrega",route:"historialentrega",icon:"group_add",nivel:1},   
    
   
  //  {name:"Estadistica",route:"estadistica",icon:"card_giftcard"}, settings_backup_restore query_builder


  
  
  ]


  fillerContent = Array.from({length: 50}, () =>
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
       labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
       laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
       voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
       cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`);

  private _mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef, 
    media: MediaMatcher,
    private authservicio: AuthService,
    private bodegaservicio: BodegaService
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  shouldRun = true;

  ngOnInit() {

    this.isLoggedIn= this.authservicio.checkLoginStatus();
    this.funcionario = sessionStorage.getItem("nombre") ?? 'Nombre no disponible';
    let bodegaString = sessionStorage.getItem("bodega");
    let bodega = parseInt(bodegaString !== null ? bodegaString : "0", 10);
    this.bodegaservicio.getRegistroId(bodega)
    .subscribe((resp: any) => {
      this.bodegaActual = resp;    
    },
      (err: any) => { console.error(err) }
    );
  }

  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem("nivel"));    
    if (isNaN(nivelUsuario)) {
      //console.warn("El nivel del usuario no es válido o no está definido");
      return false;
    }  
    return nivelUsuario >= nivelRequerido;
  }

}
