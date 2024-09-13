
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
    {name:"Paciente",route:"paciente",icon:"perm_identity"},
    { name:"Medicamentos",
      route:"medicamento",
      icon:"hdr_weak", 
      menu:"medicamentosMenu", 
       subNav: [
        { name: 'Consulta', route: '/menu/medicamento', icon: 'search' },
        { name: 'Registro', route: '/menu/medicamento/register', icon: 'add' }
      ]},
    {name:"Dispensar Formula",route:"formula",icon:"playlist_add"},
    {name:"Bodegas",route:"bodega",icon:"domain"},   
    {name:"Despacho",route:"despacho",icon:"input"},
  //  {name:"Estadistica",route:"estadistica",icon:"card_giftcard"},
  
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

}
