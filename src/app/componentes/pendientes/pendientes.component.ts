import { Component, Input, OnChanges,  OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormulaI } from 'src/app/modelos/formula.model';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';
//import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-pendientes',
  templateUrl: './pendientes.component.html',
  styleUrls: ['./pendientes.component.css']
})
export class PendientesComponent {
  listaPendienteBodega: any = [];
  listaPendienteBodegaFiltro: any = [];
  parametro: any;
  @Input() datoRecibido: number= NaN;
  busquedaForm!: FormGroup;


  
  _listFilter!: string;
  get listFilter(): string {
    return this._listFilter;
  }
  set listFilter(value: string) {
    this._listFilter = value;
    this.listaPendienteBodegaFiltro = this.listFilter ? this.performFilter(this.listFilter) : this.listaPendienteBodega;
  }

  constructor(
    private servicio: BodegaService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  //  private spinner: NgxSpinnerService,
    private fb: FormBuilder) 
    {    
      // Calcula la fecha actual
      const currentDate = new Date();      
      // Calcula la fecha 30 días antes de la fecha actual
      const date30DaysAgo = new Date(currentDate);
      date30DaysAgo.setDate(currentDate.getDate() - 90);
    //  this.spinner.show();
      // Inicializa el formulario y define los FormControl para fechainicial y fechafinal
      this.busquedaForm = this.fb.group({
        fechainicial: [date30DaysAgo.toISOString().split('T')[0]],
        fechafinal: [currentDate.toISOString().split('T')[0]],
        listFilter: [''],
      }); 
    
    
    }

    performFilter(filterBy: string): any[] {
      if (filterBy === '' || filterBy.length < 3) return this.listaPendienteBodega
      filterBy = filterBy.toLocaleLowerCase();
      return this.listaPendienteBodega.filter((filro: any) => filro.medicamento.nombre.toLocaleLowerCase().indexOf(filterBy) !== -1
        );
    
    }
  

  ngOnInit(): void {
// Configurar un intervalo que verifique la condición cada minuto (60000 milisegundos)

    this.parametro=this.datoRecibido
    this.activatedRoute.paramMap.subscribe(params => {
      this.parametro = params.get('id');   
      if (this.parametro) {
      this.buscarRegistro(this.parametro);
    }
    });
    if (this.datoRecibido) {
      this.buscarRegistro(this.datoRecibido);
    }   

  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datoRecibido'] && !changes['datoRecibido'].isFirstChange()) {
      this.buscarRegistro(this.datoRecibido);
    }
  }

  public buscarRegistro(id:number)
  {
    console.log("llege a buscar el pendiente en la bodega " + id + " en el periodo de " + this.busquedaForm.get('fechainicial')?.value + " al "+ this.busquedaForm.get('fechafinal')?.value);
    this.servicio.getMedicamentosBodegaPendiente(id,this.busquedaForm.get('fechainicial')?.value, this.busquedaForm.get('fechafinal')?.value)
      .subscribe((resp: any) => {
      this.listaPendienteBodega = resp.map((item: any) => ({
        ...item,
        estado: false, // O cualquier lógica que determine el estado
        editing: false,
      }));
     console.log(resp);
      this.listaPendienteBodega.sort((a: any, b: any) => b.nombre - a.nombre);
      this.listaPendienteBodegaFiltro=this.listaPendienteBodega
   
    });

  }

  public editarMedicamentoBodega(itemt: any) {
    itemt.editing = true;
  }

  public guardarMedicamentoBodega(itemt: any) {
    itemt.editing = false;
    // Aquí puedes añadir lógica para guardar los cambios en el servidor si es necesario
    console.log('Guardado:', itemt);
  }

  

  public eliminarMedicamentoBodega(itemt: any)
  {
   if(itemt.cantidad<=0){

    Swal.fire({
      title: 'Desea eliminar?',
      text: `El medicamento ${itemt.medicamento.nombre} de la bodega  ${itemt.bodega.nombre} - ${itemt.bodega.puntoEntrega}   en la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicio.deleteMedicamentoBodegaId(itemt.idMedicamentoBodega).subscribe(resp => {
          this.listaPendienteBodega = this.listaPendienteBodega.filter((cli: FormulaI) => cli !== itemt);
          Swal.fire({
            icon: 'success',
            title: `Ok`,
            text: `El medicamento ${itemt.medicamento.nombre} de la bodega  ${itemt.bodega.nombre} - ${itemt.bodega.puntoEntrega} ha sido eliminado correctamente.`,
          });
        },
          err => {
            Swal.fire({
              icon: 'error',
              title: `Error`,
              text: err.mensaje,
            });
          });
      }
    });

  }
  else{
    Swal.fire({
      icon: 'warning',
      title: `Verificar!`,
      text: `El medicamento ${itemt.medicamento.nombre} de la bodega  ${itemt.bodega.nombre} - ${itemt.bodega.puntoEntrega} tiene existencia actual por lo tanto no puede ser eliminado.`,
    });
  }
  }  

 
   public crearMEdicamentoBodega(itemt: any) {   
    console.log(itemt);
    this.servicio.createMedicamentoBodega(itemt)
    .subscribe({
      next: (data: any) => {
        this.router.navigate(['/entrega', itemt.idFormula]); 
      },
      error: (err) => {
        console.error('Error al adicionar el medicamento a la bodega', err);
      }
    });
      
   }


  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

}
