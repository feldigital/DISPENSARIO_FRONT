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



const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent, //canActivate: [AuthGuard],
    children: [
      { path: 'bodega', component: BodegaComponent },
      { path: 'medicamento', component: MedicamentoComponent },
      { path: 'ffarmaceutica', component: FfarmaceuticaComponent },
      { path: 'vadministracion', component: VadministracionComponent },
      { path: 'paciente', component: PacienteComponent },
      { path: 'formula', component: FormulaComponent },
      { path: 'formula/:id', component: FormulaComponent },
      { path: 'formula/formula/:idFormula', component: FormulaComponent },
      { path: 'historialformula/:id', component: HistorialformulaComponent },
      { path: 'entrega/:id', component: EntregasComponent },    
      { path: 'medico', component: MedicosComponent },
      { path: 'ips', component: IpsComponent },
      { path: 'despacho', component: DespachoComponent },
      { path: 'medicamentobodega/:id', component: MedicamentobodegaComponent },
      { path: 'pendiente/:id', component: PendientesComponent },
      { path: 'estadistica', component: EstadisticaComponent },
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
  


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
