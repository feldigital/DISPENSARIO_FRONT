import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientependiente',
  templateUrl: './pacientependiente.component.html',
  styleUrls: ['./pacientependiente.component.css']
})
export class PacientependienteComponent {
  listaPaciente: any = [];
  listaPacienteFiltro: any = [];
  parametro: any;
  generalForm!: FormGroup;
  idBodega:number =NaN;

  constructor(  
    private servicio: BodegaService,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder
  ) {    
    this.generalForm = this.fb.group({     
      listFilter: [''],
    }); 
  }

    

  ngOnInit(): void {

    this.idBodega = Number(this.activatedRoute.snapshot.paramMap.get('idBodega'));
    const idMedicamento = Number(this.activatedRoute.snapshot.paramMap.get('idMedicamento'));
    const fechaInicial = this.activatedRoute.snapshot.paramMap.get('fInicial');
    const fechaFinal = this.activatedRoute.snapshot.paramMap.get('fFinal');

  

    if ( !isNaN(this.idBodega) && !isNaN(idMedicamento) && fechaInicial && fechaFinal) {
      this.buscarRegistro(this.idBodega, fechaInicial, fechaFinal,idMedicamento);
    }  
    
      }

      public buscarRegistro(idBodega:number,fechaInicial:string, fechaFinal:string, idMedicamento:number)
      {    
        this.servicio.getPacientePendiente(idBodega,fechaInicial,fechaFinal,idMedicamento)
          .subscribe((resp: any) => {  
            console.log(resp);       
          this.listaPaciente=resp;
          console.log(resp);
          this.listaPaciente.sort((a: any, b: any) => new Date(b.fecSolicitud).getTime() - new Date(a.fecSolicitud).getTime());
          this.listaPacienteFiltro=this.listaPaciente   
        });
      } 

      reporteEnConstruccion() {
        Swal.fire({
          icon: 'info',
          title: `En construcción!`,
          text: `El reporte esta en proceso de construcción, te estaremos informando cuando esté disponible!`,
        });
      }
    
    

}
