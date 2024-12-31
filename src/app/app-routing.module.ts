import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BodegaComponent } from './componentes/bodega/bodega.component';
import { MedicamentoComponent } from './componentes/medicamento/medicamento.component';
import { FfarmaceuticaComponent } from './componentes/ffarmaceutica/ffarmaceutica.component';
import { VadministracionComponent } from './componentes/vadministracion/vadministracion.component';
import { PacienteComponent } from './componentes/paciente/paciente.component';
import { FormulaComponent } from './componentes/formula/formula.component';
import { HistorialformulaComponent } from './componentes/historialformula/historialformula.component';
import { EntregasComponent } from './componentes/entregas/entregas.component';
import { MedicosComponent } from './componentes/medicos/medicos.component';
import { IpsComponent } from './componentes/ips/ips.component';
import { DespachoComponent } from './componentes/despacho/despacho.component';
import { MedicamentobodegaComponent } from './componentes/medicamentobodega/medicamentobodega.component';
import { PendientesComponent } from './componentes/pendientes/pendientes.component';
import { LoginComponent } from './componentes/login/login.component';
import { MenuComponent } from './componentes/menu/menu.component';
import { AuthGuard } from './auth/auth.guard';
import { EstadisticaComponent } from './componentes/estadistica/estadistica.component';
import { HistorialordendespachoComponent } from './componentes/historialordendespacho/historialordendespacho.component';
import { VerordendespachoComponent } from './componentes/verordendespacho/verordendespacho.component';
import { PacientependienteComponent } from './componentes/pacientependiente/pacientependiente.component';
import { ExistenciasComponent } from './componentes/existencias/existencias.component';
import { NorotanComponent } from './componentes/norotan/norotan.component';
import { EditformulaComponent } from './componentes/editformula/editformula.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent, canActivate: [AuthGuard],
    children: [
      { path: 'bodega', component: BodegaComponent },
      { path: 'medicamento', component: MedicamentoComponent },
      { path: 'ffarmaceutica', component: FfarmaceuticaComponent },
      { path: 'vadministracion', component: VadministracionComponent },
      { path: 'paciente/:id', component: PacienteComponent },
      { path: 'paciente', component: PacienteComponent },
      { path: 'formula/:id', component: FormulaComponent },
      { path: 'formula', component: FormulaComponent },     
      { path: 'historialformula/:id', component: HistorialformulaComponent },
      { path: 'entrega/:id', component: EntregasComponent },    
      { path: 'medico', component: MedicosComponent },
      { path: 'ips', component: IpsComponent },     
      { path: 'despacho/:id', component: DespachoComponent },
      { path: 'despacho', component: DespachoComponent },
      { path: 'medicamentobodega/:id', component: MedicamentobodegaComponent },
      { path: 'medicamentobodega', component: MedicamentobodegaComponent },
      { path: 'pendiente/:id', component: PendientesComponent },
      { path: 'pendiente', component: PendientesComponent },
      { path: 'estadistica', component: EstadisticaComponent },
      { path: 'historialordendespacho', component: HistorialordendespachoComponent },
      { path: 'verordendespacho/:id', component: VerordendespachoComponent },  
      { path: 'existencias', component: ExistenciasComponent },  
      { path: 'norotan', component: NorotanComponent },  
      { path: 'editformula/:id', component: EditformulaComponent },
      { path: 'pacientependiente/:idBodega/:idMedicamento/:fInicial/:fFinal', component: PacientependienteComponent },
      { path: '', redirectTo: '/menu/formula', pathMatch: 'full' } // Ruta por defecto
    ]
  }, 
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

/*
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent, canActivate: [AuthGuard],
    children: [
      { path: 'bodega', component: BodegaComponent },
      { path: 'medicamento', component: MedicamentoComponent },
      { path: 'ffarmaceutica', component: FfarmaceuticaComponent },
      { path: 'vadministracion', component: VadministracionComponent },
      { path: 'paciente', component: PacienteComponent },
      { path: 'paciente/:id', component: PacienteComponent },
      { path: 'formula', component: FormulaComponent },
      { path: 'formula/:id', component: FormulaComponent },
      { path: 'formula/formula/:idFormula', component: FormulaComponent },
      { path: 'historialformula/:id', component: HistorialformulaComponent },
      { path: 'entrega/:id', component: EntregasComponent },    
      { path: 'medico', component: MedicosComponent },
      { path: 'ips', component: IpsComponent },
      { path: 'despacho', component: DespachoComponent },
      { path: 'despacho/:id', component: DespachoComponent },
      { path: 'medicamentobodega/:id', component: MedicamentobodegaComponent },
      { path: 'pendiente/:id', component: PendientesComponent },
      { path: 'estadistica', component: EstadisticaComponent },
      { path: 'historialordendespacho', component: HistorialordendespachoComponent },
      { path: 'verordendespacho/:id', component: VerordendespachoComponent },  
      { path: '', redirectTo: '/menu/formula', pathMatch: 'full' } // Ruta por defecto
    ]
  }, 
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'bodega', component: BodegaComponent },
  { path: 'medicamento', component: MedicamentoComponent },
  { path: 'ffarmaceutica', component: FfarmaceuticaComponent },
  { path: 'vadministracion', component: VadministracionComponent },
  { path: 'paciente', component: PacienteComponent },
  { path: 'paciente/:id', component: PacienteComponent },
  { path: 'formula', component: FormulaComponent },
  { path: 'formula/:id', component: FormulaComponent },
  { path: 'formula/formula/:idFormula', component: FormulaComponent },
  { path: 'historialformula/:id', component: HistorialformulaComponent },
  { path: 'entrega/:id', component: EntregasComponent },
  { path: 'medico', component: MedicosComponent },
  { path: 'ips', component: IpsComponent },
  { path: 'despacho', component: DespachoComponent },
  { path: 'despacho/:id', component: DespachoComponent },
  { path: 'medicamentobodega/:id', component: MedicamentobodegaComponent },
  { path: 'pendiente/:id', component: PendientesComponent },
  { path: 'estadistica', component: EstadisticaComponent }, 
  { path: 'historialordendespacho', component: HistorialordendespachoComponent },
  { path: 'verordendespacho/:id', component: VerordendespachoComponent },
  


];*/

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
