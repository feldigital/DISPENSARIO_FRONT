
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { PacienteService } from 'src/app/servicios/paciente.service';
import { FormulaService } from 'src/app/servicios/formula.service';

@Component({
  selector: 'app-historialentrega',
  templateUrl: './historialentrega.component.html',
  styleUrls: ['./historialentrega.component.css']
})
export class HistorialentregaComponent {

  generalForm!: FormGroup;
  listaregistros: any;
  listaformulas: any;
  tablavisible: boolean = false;
  listaItemsFormula: any;
  formulaActual: any;
  ajusteActual: any = null;

  constructor(
    private servicio: PacienteService,
    private servicioformula: FormulaService,
    private fb: FormBuilder) {
    // Calcula la fecha actual
    const currentDate = new Date();
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 90);
    // Inicializa el formulario y define los FormControl para fechainicial y fechafinal
    this.generalForm = this.fb.group({
      fechainicial: [date30DaysAgo.toISOString().split('T')[0]],
      fechafinal: [currentDate.toISOString().split('T')[0]],
      documento: [''],
    });
  }

  public buscarRegistro() {
    this.servicio.getRegistroDocumento(this.generalForm.get('documento')?.value)
      .subscribe((resp: any) => {
        this.listaregistros = resp     
        if (resp && resp.length > 1) {
          Swal.fire({
            icon: 'warning',
            title: `DOCUMENTO DUPLICADO`,
            text: `Este documento está duplicado en la base de datos. Identifique claramente al paciente para consultar el medicamento.`,
          });          
          this.listaformulas = {};
          return;
        }      

        if (resp && resp.length === 1) {         
          this.buscarFormulas(resp[0].idPaciente)    
          this.listaItemsFormula = {};
        }

});
  }

  public buscarFormulas(id: number) {  
    this.servicioformula.getFormulaIdPaciente(id,this.generalForm.get('fechainicial')?.value, this.generalForm.get('fechafinal')?.value)
      .subscribe((resp: any) => {   
        this.listaformulas = resp 
        this.listaformulas.sort((a: any, b: any) => b.idFormula - a.idFormula);
      });

  }

  

  calcularPendiente(item: any): number {
    return item.cantidad - item.totalEntregado;
  }


  mostrarItemformula(item: any): void {
    this.listaItemsFormula=item.items;
    this.formulaActual=item.idFormula;
    this.ajusteActual=item;
  }
  
  mostrarformula(item: any): void {   
    
   if (item.formulas && Array.isArray(item.formulas) && item.formulas.length > 0) 
    {this.listaformulas=item.formulas;}
    else{
      Swal.fire({
        icon: 'info',
        title: `Información`,
        text: `El paciente no tiene formulas prescritas de medicamentos en el periodo seleccionado!.`,
      });
    }
  }

  public primerasmayusculas(str: string): string {
  if (!str) {
    return str;
  }
  str = str.toLowerCase();
  return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
}

}

