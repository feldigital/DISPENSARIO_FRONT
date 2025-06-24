import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BodegaService } from 'src/app/servicios/bodega.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-prescritos',
  templateUrl: './prescritos.component.html',
  styleUrls: ['./prescritos.component.css']
})
export class PrescritosComponent {

 listaentregas: any = [];
  parametro: any;
  generalForm!: FormGroup;
  listaregistros: any;
  medicamentosFiltrados: any[] = [];
  totalCantidadEntregada:number =0;
  medicamentoIds: number[] = [];
  medicamentoIdsInput: string = '';
  tableVista:boolean= true;


  constructor(
    private servicio: BodegaService, 
  

    private fb: FormBuilder) {
    // Calcula la fecha actual
    const currentDate = new Date();
    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() - 365);
    //  this.spinner.show();
    // Inicializa el formulario y define los FormControl para fechainicial y fechafinal
    this.generalForm = this.fb.group({
      idBodega: [''],
      fInicial: [date30DaysAgo.toISOString().split('T')[0]],
      fFinal: [currentDate.toISOString().split('T')[0]],
      medicamento: [{ value: '', disabled: true }],
      todosMedicamentos:[true],
      vista:[false],
    });


  }

  ngOnInit(): void {
    this.parametro = parseInt(sessionStorage.getItem('bodega') || '0', 10);

    this.servicio.getRegistrosActivos().subscribe(
      (resp: any) => {
        this.listaregistros = resp.filter((registro: any) => registro.dispensa === true);
        this.listaregistros.sort((a: any, b: any) => {
          const comparacionPorNombre = a.nombre.localeCompare(b.nombre);
          if (comparacionPorNombre === 0) {
            return a.puntoEntrega.localeCompare(b.puntoEntrega);
          }
          return comparacionPorNombre;
        });

        // Establecer el valor del select después de que se cargan los registros
        if (this.parametro) {
          this.generalForm.patchValue({ idBodega: +this.parametro });
        }
      },
      (err: any) => {
        console.error(err);
      }
    );
    // Escuchar cambios en el select de bodegas
    this.generalForm.get('idBodega')!.valueChanges.subscribe((nuevoIdBodega: number) => {
      if (nuevoIdBodega) {
        this.parametro = nuevoIdBodega;      
          this.buscarRegistro(this.parametro);       
      }
    }); 
   
     // Suscribirse a cambios del checkbox
  this.generalForm.get('todosMedicamentos')?.valueChanges.subscribe((isChecked) => {
    const medicamentoControl = this.generalForm.get('medicamento');
    if (isChecked) {
      medicamentoControl?.disable();
    } else {
      medicamentoControl?.enable();
    }
  });    
  }


  public buscarRegistro(idBodega: number) {
    if (idBodega) {
      // Limpiar listas antes de cargar nueva data
      this.listaentregas = [];
      this.totalCantidadEntregada =0;
      // Mostrar spinner mientras carga
      this.medicamentoIdsInput=this.generalForm.get('medicamento')?.value;
      if (this.medicamentoIdsInput) {
        this.medicamentoIds = this.medicamentoIdsInput
          .split(',')
          .map(id => id.trim())      // quita espacios en blanco
          .filter(id => id !== '')   // descarta vacíos
          .map(id => +id)            // convierte a número
          .filter(id => !isNaN(id)); // descarta lo que no es número
      } else {
        this.medicamentoIds = [];
      }

      Swal.fire({
        title: 'Cargando registros...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const  registro = {
        idBodega: idBodega,
        fInicio: this.generalForm.get('fInicial')?.value,
        fFinal: this.generalForm.get('fFinal')?.value,
        medicamentoIds: this.medicamentoIds
      };
     
      if(this.medicamentoIds.length==1 && this.generalForm.get('vista')?.value && idBodega==0)
        {
        this.tableVista=false;
        this.servicio.obtenerMedicamentoPrescritosEntregaPorBodega(registro)
        .subscribe((resp: any) => {
          this.listaentregas = resp;             
          Swal.close(); // ✅ Cerrar el spinner al terminar correctamente          
          const totalEntregado = this.listaentregas.reduce((sum: number, item: any) => {
            return sum + (item.cantidadEntrega || 0); // usa 0 si el valor es null/undefined
          }, 0);

          this.totalCantidadEntregada = totalEntregado;
        },
          (error) => {
            console.error('❌ Error cargando registros', error);
            Swal.close(); // 🚨 Primero cerramos el spinner
            Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
          }
        );
        return ;
      }

      this.tableVista=true;
      this.servicio.obtenerMedicamentoPrescritosEntrega(registro)
        .subscribe((resp: any) => {
          this.listaentregas = resp;  
                
          Swal.close(); // ✅ Cerrar el spinner al terminar correctamente          
          const totalEntregado = this.listaentregas.reduce((sum: number, item: any) => {
            return sum + (item.cantidadEntrega || 0); // usa 0 si el valor es null/undefined
          }, 0);

          this.totalCantidadEntregada = totalEntregado;
        },
          (error) => {
            console.error('❌ Error cargando registros', error);
            Swal.close(); // 🚨 Primero cerramos el spinner
            Swal.fire('Error', 'No se pudieron cargar los registros.', 'error');
          }
        );
    }
    else {
      Swal.fire({
        icon: 'error',
        title: `Verificar`,
        text: `No ha seleccionado ninguna bodega en donde se va a realizar la busqueda!.`,
      });

    }
  }


  
    exportarExcelPrescritos() {  
      // Crea un array con los datos que deseas exportar     
      const datos: any[] = [];      
      // Encabezados de la tabla
      const encabezado = [
        'ID',
        'CUM',
        'ATC',
        'NOMBRE DEL MEDICAMENTO',
        'CONCENTRACION',       
        'PRESENTACION',
        'VIA',
        'VALOR',
        'BODEGA',
        'PRESCRITOS ENERO',
        'ENTREGADOS ENERO',
        'PRESCRITOS FEBRERO',
        'ENTREGADOS FEBRERO',
        'PRESCRITOS MARZO',
        'ENTREGADOS MARZO',
        'PRESCRITOS ABRIL',
        'ENTREGADOS ABRIL',
        'PRESCRITOS MAYO',
        'ENTREGADOS MAYO',
        'PRESCRITOS JUNIO',
        'ENTREGADOS JUNIO',
        'PRESCRITOS JULIO',
        'ENTREGADOS JULIO',
        'PRESCRITOS AGOSTO',
        'ENTREGADOS AGOSTO',
        'PRESCRITOS SEPTIEMBRE',
        'ENTREGADOS SEPTIEMBRE',
        'PRESCRITOS OCTUBRE',
        'ENTREGADOS OCTUBRE',
        'PRESCRITOS NOVIEMBRE',
        'ENTREGADOS NOVIEMBRE',
        'PRESCRITOS DICIEMBRE',
        'ENTREGADOS DICIEMBRE',
      ];
  
      datos.push(encabezado);
      
      // Agrega los items de despacho al array
      this.listaentregas.forEach((item: any) => {
       
  
        datos.push([
          item.id || '',  // Validación si es null o undefined
          item.codigoCum || '',
          item.codigoAtc || '',
          item.nombre || '',
          item.formaFarmaceutica || '',
          item.viaAdministracion || '',
          item.concentracion || '',
          item.valor || '',
          item.bodega || '',
          item.enero || '',
          item.eneroEntregado || '',
          item.febrero || '',
          item.febreroEntregado || '',
          item.marzo || '',
          item.marzoEntregado || '',
          item.abril || '',
          item.abrilEntregado || '',
          item.mayo || '',
          item.mayoEntregado || '',
          item.junio || '',
          item.junioEntregado || '',
          item.julio || '',
          item.julioEntregado || '',
          item.agosto || '',
          item.agostoEntregado || '',
          item.septiembre || '',
          item.septiembreEntregado || '',
          item.octubre || '',
          item.octubreEntregado || '',
          item.noviembre || '',
          item.noviembreEntregado || '',
          item.diciembre || '',
          item.diciembreEntregado || ''
         
        ]);
      });
  
      // Crea la hoja de trabajo de Excel (worksheet)
      const hojaDeTrabajo: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(datos);
  
      // Aplicar formato al encabezado
      const rangoEncabezado = XLSX.utils.decode_range(hojaDeTrabajo['!ref'] as string);
      for (let col = rangoEncabezado.s.c; col <= rangoEncabezado.e.c; col++) {
        const celda = hojaDeTrabajo[XLSX.utils.encode_cell({ r: 0, c: col })]; // Primera fila, r: 0
        if (celda) {
          celda.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } }, // Texto en negrita y color blanco
            alignment: { horizontal: "center", vertical: "center" }, // Centrado horizontal y vertical
            fill: { fgColor: { rgb: "4F81BD" } }, // Color de fondo azul
          };
        }
      }
  
      // Crea el libro de trabajo (workbook)
      const libroDeTrabajo: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'consolidado');
      // Genera y descarga el archivo Excel
      XLSX.writeFile(libroDeTrabajo, 'Prescritos_Entregados' + new Date().getTime() + '.xlsx');
      Swal.fire({
        icon: 'success',
        title: `Ok`,
        text: `Su reporte fue exportado en su carpeta de descargas en formato xlsx`,
  
      });
    }
  



  public primerasmayusculas(str: string): string {
    if (!str) {
      return str;
    }
    str = str.toLowerCase();
    return str.replace(/\b\w/g, (char) => char.toLocaleUpperCase());
  }

   reporteEnConstruccion() {
      Swal.fire({
        icon: 'info',
        title: `En construcción!`,
        text: `El reporte esta en proceso de construcción, te estaremos informando cuando esté disponible!`,
      });
    }
  

}


