import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms'; 
import { FormsModule } from '@angular/forms';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { PermisosService } from './servicios/permisos.service';



import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MenuComponent } from './componentes/menu/menu.component';
import { FfarmaceuticaComponent } from './componentes/ffarmaceutica/ffarmaceutica.component';
import { VadministracionComponent } from './componentes/vadministracion/vadministracion.component';
import { PacienteComponent } from './componentes/paciente/paciente.component';
import { FormulaComponent } from './componentes/formula/formula.component';
import { MedicamentoComponent } from './componentes/medicamento/medicamento.component';
import { BodegaComponent } from './componentes/bodega/bodega.component';

import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatAutocompleteModule} from '@angular/material/autocomplete'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule} from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { DetalleformulaComponent } from './componentes/detalleformula/detalleformula.component';
import { EntregasComponent } from './componentes/entregas/entregas.component';
import { IpsComponent } from './componentes/ips/ips.component';
import { MedicosComponent } from './componentes/medicos/medicos.component';
import { DespachoComponent } from './componentes/despacho/despacho.component';
import { MedicamentobodegaComponent } from './componentes/medicamentobodega/medicamentobodega.component';
import { PendientesComponent } from './componentes/pendientes/pendientes.component';
import { LoginComponent } from './componentes/login/login.component';
import { EstadisticaComponent } from './componentes/estadistica/estadistica.component';
import { BuscarpacienteComponent } from './componentes/buscarpaciente/buscarpaciente.component';
import { ImportarafiliadosComponent } from './componentes/importarafiliados/importarafiliados.component';
import { HistorialordendespachoComponent } from './componentes/historialordendespacho/historialordendespacho.component';
import { VerordendespachoComponent } from './componentes/verordendespacho/verordendespacho.component';
import { HistorialformulaComponent } from './componentes/historialformula/historialformula.component';
import { PacientependienteComponent } from './componentes/pacientependiente/pacientependiente.component';
import { ExistenciasComponent } from './componentes/existencias/existencias.component';
import { NorotanComponent } from './componentes/norotan/norotan.component';
import { EditformulaComponent } from './componentes/editformula/editformula.component';


export function initPermisos(permisosService: PermisosService) {
  return () => permisosService.cargarPermisos();
}

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    FfarmaceuticaComponent,
    VadministracionComponent,
    PacienteComponent,
    FormulaComponent,
    MedicamentoComponent,
    BodegaComponent,
    DetalleformulaComponent,
    HistorialformulaComponent,
    EntregasComponent,
    IpsComponent,
    MedicosComponent,
    DespachoComponent,
    MedicamentobodegaComponent,
    PendientesComponent,
    LoginComponent,
    EstadisticaComponent,
    BuscarpacienteComponent,
    ImportarafiliadosComponent,
    HistorialordendespachoComponent,
    VerordendespachoComponent,
    PacientependienteComponent,
    ExistenciasComponent,
    NorotanComponent,
    EditformulaComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatMenuModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDialogModule,

  ],

  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initPermisos,
      deps: [PermisosService],
      multi: true
    }
  ] ,
  bootstrap: [AppComponent]
})
export class AppModule { }
