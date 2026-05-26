import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, OnInit,AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { AuthService } from 'src/app/servicios/auth.service';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy, AfterViewInit{

  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;
  private bodegaSub?: Subscription;

  @ViewChildren('menuLabel') menuLabels!: QueryList<ElementRef>;

tooltipMap: { [key: string]: string | null } = {};

  isLoggedIn = false;
  funcionario = '';
  bodegaActual: any;
  shouldRun = true;
  sidebarOpen = true;

  menuAgrupado = [
     {
      nombre: 'Inicio',
      icon: 'home',
      items: [
        { name:"Dashboard",route:"inicio",icon:"dashboard",nivel:2},
       
      ]
    },
    {
      nombre: 'Gestión Farmacológica',
      icon: 'medical_services',
      items: [
     
        { name:"Paciente",route:"paciente",icon:"perm_identity",nivel:3},
        { name:"Medicamentos",route:"medicamento",icon:"medication",nivel:3}, 
        { name:"Bodegas",route:"bodega",icon:"domain",nivel:2},
        { name:"Dispensar Formula",route:"formula",icon:"playlist_add",nivel:2},
        { name:"Editar Formula",route:"editformula",icon:"edit",nivel:4},        
        { name:"Historial de entrega",route:"historialentrega",icon:"group_add",nivel:1}
      ]
    },
    {
      nombre: 'Seguimiento',
      icon: 'inventory',
      items: [
        { name:"Pendientes",route:"pendiente",icon:"pending_actions",nivel:2},
        {name:"Existencias",route:"existencias",icon:"playlist_add_check",nivel:2},        
        {name:"Vencidos",route:"vencidos",icon:"alarm_off",nivel:2},
        {name:"No rotan",route:"norotan",icon:"pause_circle_outline",nivel:2},
        {name:"Medicamentos bodega",route:"medicamentobodega",icon:"category",nivel:2},   
        {name:"Pqrs",route:"historialpqrs",icon:"support_agent",nivel:2}   
       
      ]
    },
    {
      nombre: 'Logística',
      icon: 'local_shipping',
      items: [
        {name:"Ordenes",route:"despacho",icon:"input",nivel:2},
        {name:"Trazabilidad de Medicamento",route:"trazamedicamento",icon:"shuffle",nivel:2},
        {name:"Ajuste por inventario",route:"ajusteinventario",icon:"compare_arrows",nivel:2}
      ]
    },
    {
      nombre: 'Reportes',
      icon: 'analytics',
      items: [
        {name:"Prescritos y entregas",route:"prescritos",icon:"donut_small",nivel:2},
        {name:"Captados por Dx",route:"captadosdx",icon:"query_stats",nivel:2},        
        {name:"Medicamento entregado",route:"entregados",icon:"check_circle_outline",nivel:2},
        {name:"Medicamento contrato",route:"medicamentoeps",icon:"list_alt",nivel:3},
    
      ]
    }
  ];

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private authService: AuthService,
    private bodegaService: BodegaService,
    private router: Router,
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 768px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  ngAfterViewInit() {
  setTimeout(() => {
    this.menuLabels.forEach((labelRef, index) => {
      const element = labelRef.nativeElement;
      const route = this.getRouteByIndex(index);

      if (element.scrollWidth > element.clientWidth) {
        this.tooltipMap[route] = element.innerText;
      } else {
        this.tooltipMap[route] = null;
      }
    });
  });
}

  ngOnInit(): void {

    // 🔥 Recuperar estado sidebar
    const savedState = localStorage.getItem('sidebarOpen');
    this.sidebarOpen = savedState !== null ? savedState === 'true' : true;

    // 🔐 Login
    this.isLoggedIn = this.authService.checkLoginStatus();
    this.funcionario = sessionStorage.getItem("nombre") ?? 'Usuario';

    // 🏥 Bodega
    const bodega = Number(sessionStorage.getItem("bodega")) || 0;

    if (bodega > 0) {
      this.bodegaSub = this.bodegaService
        .getRegistroId(bodega)
        .subscribe((resp: any) => {
          this.bodegaActual = resp;
        });
    }
  }

  toggleSidebar(): void {
     this.sidebarOpen = !this.sidebarOpen;

  // Ajusta dinámicamente el margin-left del content-wrapper
  const content = document.querySelector('.content-wrapper') as HTMLElement;
  if(content) {
    content.style.marginLeft = this.sidebarOpen ? '210px' : '0';  }
  // Trigger resize para recalcular layouts de componentes internos
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 300); // mismo tiempo que la transición CSS
  localStorage.setItem('sidebarOpen', this.sidebarOpen.toString());
}
  
 

  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem('nivel'));
    return !isNaN(nivelUsuario) && nivelUsuario >= nivelRequerido;
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('change', this._mobileQueryListener);
    this.bodegaSub?.unsubscribe();
  }

  isGrupoActivo(grupo: any): boolean {
  return grupo.items.some((item: any) =>
    this.router.url.includes(item.route)
  );
}
esRutaActiva(ruta: string): boolean {
  return this.router.url.startsWith('/menu/' + ruta);
}
isTextTruncated(element: HTMLElement): boolean {
  return element.scrollWidth > element.clientWidth;
}
getRouteByIndex(index: number): string {
  const flatItems = this.menuAgrupado
    .flatMap((grupo: any) => grupo.items)
    .filter((item: any) => this.tieneAcceso(item.nivel));

  return flatItems[index]?.route;
}

}