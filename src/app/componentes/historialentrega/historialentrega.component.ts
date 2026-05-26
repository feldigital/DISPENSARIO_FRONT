
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
  indexExpandidoTabla2: number | null = null;

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
  this.formulaActual = null
  this.servicioformula.getFormulaIdPaciente(
    id,
    this.generalForm.get('fechainicial')?.value, 
    this.generalForm.get('fechafinal')?.value
  )
  .subscribe((resp: any) => {   
    // Validamos si la respuesta está vacía o es nula
    if (!resp || resp.length === 0) {
      this.listaformulas = []; // Limpiamos la lista para actualizar la vista
       Swal.fire({
        icon: 'info',
        title: `Información`,
        text: `El paciente no tiene formulas prescritas en el periodo seleccionado!.`,
        confirmButtonColor: '#009A94' // Opcional: para que combine con tu diseño
      });
      
    } else {
      // Si hay registros, los asignamos y ordenamos
      this.listaformulas = resp;
      this.listaformulas.sort((a: any, b: any) => b.idFormula - a.idFormula);
    }
  }, (error) => {
    // Es buena práctica manejar errores de red o del servidor
    console.error('Error al buscar fórmulas', error);
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
 

  public primerasmayusculas(str: string): string {
  if (!str) {
    return str;
  }
  str = str.toLowerCase();
  return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
}

// En tu archivo .ts agrega o modifica esta lógica:
seleccionarFormula(formula: any) {
    // Si la fórmula actual es la misma que ya está abierta, la cerramos (null)
    if (this.formulaActual === formula.idFormula) {
        this.formulaActual = null;
        this.listaItemsFormula = []; // Limpiamos los items para que se oculte la tabla
    } else {
        // Si es una diferente, llamamos a tu procedimiento normal
        this.mostrarItemformula(formula);
    }
}

}

