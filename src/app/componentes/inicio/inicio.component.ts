import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { DashboardService } from 'src/app/servicios/dashboard.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {

  // 🔥 Referencia al chart para forzar actualización
  @ViewChild('pieChart', { read: BaseChartDirective })
  pieChart?: BaseChartDirective;

  public formulasDia: number = 0;
  public formulasSemana: number = 0;
  public formulasMes: number = 0;
  
  public formulasNoProcesadas: number = 0;
  public ordenesNoRecibidas: number = 0;
  public pqrsNoResueltas: number = 0;

  generalForm!: FormGroup;
  listaregistros: any;
  parametro: any;
  mesActivo: Date = new Date();
  listaVencidos: any[] = [];
  //loading: boolean = true;

  constructor(private dashboardService: DashboardService,
    private servicio: BodegaService,
    private fb: FormBuilder
  ) {

    // Calcula la fecha actual
    const currentDate = new Date();

    // Calcula la fecha 30 días antes de la fecha actual
    const date30DaysAgo = new Date(currentDate);
    date30DaysAgo.setDate(currentDate.getDate() + 180); //date30DaysAgo.toISOString().split('T')[0]]
    //  this.spinner.show();
    // Inicializa el formulario y define los FormControl para fechainicial y fechafinal
    this.generalForm = this.fb.group({
      idBodega: [''],
      fechainicial: [currentDate.toISOString().split('T')[0]],
      fechafinal: [currentDate.toISOString().split('T')[0]]

    });
  }

  ngOnInit(): void {
    this.servicio.getRegistrosActivos().subscribe(
      (resp: any) => {
        this.listaregistros = resp;//.filter((registro: any) => registro.dispensa === true);
        this.listaregistros.sort((a: any, b: any) => {
          const comparacionPorNombre = a.nombre.localeCompare(b.nombre);
          if (comparacionPorNombre === 0) {
            return a.puntoEntrega.localeCompare(b.puntoEntrega);
          }
          return comparacionPorNombre;
        });

        this.parametro = parseInt(sessionStorage.getItem('bodega') || '0', 10);
        if (this.parametro && !isNaN(this.parametro)) {
          this.cargarEstadistica();
        }

        // Establecer el valor del select después de que se cargan los registros
        if (this.parametro) {
          this.generalForm.patchValue({ idBodega: +this.parametro }, { emitEvent: false });
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
        this.listaVencidos = [];
        this.cargarEstadistica();
      }
    });

    this.generalForm.get('fechainicial')!
      .valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(fecha => !!fecha)
      )
      .subscribe((fecha: any) => {
        this.mesActivo = new Date(fecha);
        this.listaVencidos = [];
        this.cargarEstadistica();

      });
  }

  // ✅ Cargar datos desde backend
  cargarEstadistica() {
    this.dashboardService.obtenerEstadisticasFormula(
      this.parametro, this.generalForm.get('fechainicial')?.value
    ).subscribe({
      next: (data: any[]) => {
        this.formulasDia = data.find(x => x.nombre === "Dia")?.valor || 0;
        this.formulasSemana = data.find(x => x.nombre === "Semana")?.valor || 0;
        this.formulasMes = data.find(x => x.nombre === "Mes")?.valor || 0;
      },
      error: (err) => console.error("❌ Error:", err)

    });

    this.dashboardService.obtenerEstadisticasGenerales(
      this.parametro, this.generalForm.get('fechainicial')?.value
    ).subscribe({
      next: (data: any[]) => {
        this.formulasNoProcesadas = data.find(x => x.nombre === "formula")?.valor || 0;
        this.ordenesNoRecibidas = data.find(x => x.nombre === "orden")?.valor || 0;
        this.pqrsNoResueltas = data.find(x => x.nombre === "pqrs")?.valor || 0;
      },
      error: (err) => console.error("❌ Error:", err)
    });

    


    this.dashboardService.getEstadisticaCrea(
      this.parametro,
      this.generalForm.get('fechainicial')?.value
    ).subscribe(resp => {
      const responseArray = Array.isArray(resp) ? resp : [resp];
      // Convertimos y ordenamos de mayor a menor 🔥
      const ordenado = responseArray
        .map(r => ({
          nombre: r.nombre,
          valor: Number(r.valor)
        }))
        .sort((a, b) => b.valor - a.valor);
      const labels = ordenado.map(r => r.nombre);
      const data = ordenado.map(r => r.valor);
      const maxValor = Math.max(...data);
      this.barChartDataHorizontal = {
        labels: labels,
        datasets: [
          {
            data: data,
            label: 'Fórmulas creadas',
            backgroundColor: data.map(valor =>
              valor === maxValor ? '#0F766E' : '#2563EB'
            ),
            hoverBackgroundColor: data.map(valor =>
              valor === maxValor ? '#065F46' : '#1D4ED8'
            ),
            borderRadius: 6,        // 🔥 Bordes redondeados (más moderno)
            barThickness: 18        // 🔥 Grosor elegante
          }]
      };
    });

     if (this.tieneAcceso(4)) {
      const obsTotal = this.dashboardService.getEstadisticaFormulasUltimosMeses(
        this.parametro, this.generalForm.get('fechainicial')?.value
      );
      const obsIncompletas = this.dashboardService.getEstadisticaFormulasIncompletasMeses(
        this.parametro, this.generalForm.get('fechainicial')?.value
      );

      forkJoin([obsTotal, obsIncompletas])
        .subscribe(([resTotal, resIncompletas]) => {
        const arrayTotal = Array.isArray(resTotal) ? resTotal : [resTotal];
        const arrayIncompletas = Array.isArray(resIncompletas) ? resIncompletas : [resIncompletas];
        const labels = arrayTotal.map(r => r.nombre);
        // 1. Calculamos los datos numéricos
        const dataIncompletas = arrayIncompletas.map(r => Number(r.valor));
        const dataCompletas = arrayTotal.map((r, i: number) => {
          const total = Number(r.valor);
          const incompleta = Number(arrayIncompletas[i]?.valor || 0);
          return total - incompleta;
        });

        const esUltimoMes = (index: number) => index === arrayTotal.length - 1;
        // 2. Generamos los estilos (Tipando i como number para evitar el error TS7006)
        const bgCompletas = dataCompletas.map((_, i: number) => esUltimoMes(i) ? '#28a745' : '#1f4e79');
        const borderCompletas = dataCompletas.map((_, i: number) => esUltimoMes(i) ? '#1e7e34' : '#163d5c');
        const bgParciales = dataIncompletas.map((_, i: number) => esUltimoMes(i) ? '#91cf91' : '#ff9800');
        const borderParciales = dataIncompletas.map((_, i: number) => esUltimoMes(i) ? '#1e7e34' : '#e68a00');
        // Aquí corregimos el error que mencionaste
        const borderThickness = dataCompletas.map((_, i: number) => esUltimoMes(i) ? 3 : 1);
        this.barChartDataVertical = {
          labels: labels,
          datasets: [
            {
              label: 'Formula entregas completa',
              data: dataCompletas,
              backgroundColor: bgCompletas,
              borderColor: borderCompletas,
              borderWidth: borderThickness,
              borderRadius: 6
            },
            {
              label: 'Formula entregas parciales',
              data: dataIncompletas,
              backgroundColor: bgParciales,
              borderColor: borderParciales,
              borderWidth: borderThickness,
              borderRadius: 6
            }
          ]
        };
      });
    }
    else {
    
      this.dashboardService.getEstadisticaFormulasUltimosMeses(
        this.parametro,
        this.generalForm.get('fechainicial')?.value
      ).subscribe(resp => {
        const responseArray = Array.isArray(resp) ? resp : [resp];
        const labels = responseArray.map(r => r.nombre);
        const data = responseArray.map(r => Number(r.valor));
        const azulBase = '#1f4e79';
        const verdeActual = '#28a745';
        const backgroundColors = data.map((_, index) =>
          index === data.length - 1 ? verdeActual : azulBase
        );
        const borderColors = data.map((_, index) =>
          index === data.length - 1 ? '#1e7e34' : '#163d5c'
        );
        const borderWidth = data.map((_, index) =>
          index === data.length - 1 ? 3 : 1
        );

        this.barChartDataVertical = {
          labels: labels,
          datasets: [
            {
              label: 'Número de fórmulas',
              data: data,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: borderWidth,
              borderRadius: 6
            }
          ]
        };

        this.barChartOptionsVertical = {
          responsive: true,
          animation: {
            duration: 1200,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                afterLabel: (context: any) => {
                  if (context.dataIndex === data.length - 1) {
                    return 'Mes actual';
                  }
                  return '';
                }
              }
            }
          }
          
        };
       
      });

    }

this.dashboardService.getEstadisticaFormulasUltimosMesesNoReclamadas(
        this.parametro,
        this.generalForm.get('fechainicial')?.value
      ).subscribe(resp => {
       
        const responseArray = Array.isArray(resp) ? resp : [resp];
        const labels = responseArray.map(r => r.nombre);
        const data = responseArray.map(r => Number(r.valor));
        const azulBase = '#e22929';
        const verdeActual = '#28a745';
        const backgroundColors = data.map((_, index) =>
          index === data.length - 1 ? verdeActual : azulBase
        );
        const borderColors = data.map((_, index) =>
          index === data.length - 1 ? '#1e7e34' : '#e22929'
        );
        const borderWidth = data.map((_, index) =>
          index === data.length - 1 ? 3 : 1
        );

        this.barChartDataNoReclamdas = {
          labels: labels,
          datasets: [
            {
              label: 'Número de fórmulas',
              data: data,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: borderWidth,
              borderRadius: 6
            }
          ]
        };

        this.barChartOptionsVertical = {
          responsive: true,
          animation: {
            duration: 1200,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                afterLabel: (context: any) => {
                  if (context.dataIndex === data.length - 1) {
                    return 'Mes actual';
                  }
                  return '';
                }
              }
            }
          }
        };
      });


    this.dashboardService.getEstadisticaTopMedicamentos(
      this.parametro,
      this.generalForm.get('fechainicial')?.value
    ).subscribe(resp => {

      const responseArray = Array.isArray(resp) ? resp : [resp];
      // Convertimos y ordenamos de mayor a menor 🔥
      const ordenado = responseArray
        .map(r => ({
          nombre: r.nombre,
          valor: Number(r.valor)
        }))
        .sort((a, b) => b.valor - a.valor);
      const labels = ordenado.map(r => r.nombre);
      const data = ordenado.map(r => r.valor);
      const maxValor = Math.max(...data);
      this.barChartDataTop = {
        labels: labels,

        datasets: [
          {
            data: data,
            backgroundColor: '#16a34a',   // verde profesional
            hoverBackgroundColor: '#a8d6b9',
            borderRadius: 8,
            barThickness: 8
          }
        ]
      };

    });

    this.dashboardService.getEstadisticaEstadoOrden(
      this.parametro,
      this.generalForm.get('fechainicial')?.value
    ).subscribe(resp => {

      const responseArray = Array.isArray(resp) ? resp : [resp];
      // Convertimos y ordenamos de mayor a menor 🔥
      const ordenado = responseArray
        .map(r => ({
          nombre: r.nombre,
          valor: Number(r.valor)
        }))
      const labels = ordenado.map(r => r.nombre);
      const data = ordenado.map(r => r.valor);
      this.doughnutChartData = {
        labels: labels,
        datasets: [
          {
            data: data,
          }
        ]
      };
    });


    this.dashboardService.getEstadisticaTopMedicamentosPendiente(
      this.parametro,
      this.generalForm.get('fechainicial')?.value
    ).subscribe(resp => {
      const responseArray = Array.isArray(resp) ? resp : [resp];
      // Convertimos y ordenamos de mayor a menor 🔥
      const ordenado = responseArray
        .map(r => ({
          nombre: r.nombre,
          valor: Number(r.valor)
        }))
        .sort((a, b) => b.valor - a.valor);
      const labels = ordenado.map(r => r.nombre);
      const data = ordenado.map(r => r.valor);
      const maxValor = Math.max(...data);
      this.barChartDataTopPendiente = {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: '#f14d41',   // verde profesional
            hoverBackgroundColor: '#c8f2f5',
            borderRadius: 8,
            barThickness: 8
          }
        ]
      };
    });


    this.dashboardService.getEstadisticaVencimientos(
      this.parametro).subscribe(resp => {
        console.log('esta es la lista de pendientes', resp);
        const responseArray = Array.isArray(resp) ? resp : [resp];
        const labels = responseArray.map(r => r.nombre);
        const data = responseArray.map(r => Number(r.valor));
        const rojo = '#dc3545';
        const naranja = '#fd7e14';
        const amarillo = '#ffc107';
        const verde = '#28a745';

        const bordeRojo = '#b02a37';
        const bordeNaranja = '#d65a00';
        const bordeAmarillo = '#d39e00';
        const bordeVerde = '#1e7e34';

        const backgroundColors = data.map((_, index) => {
          if (index === 0) return rojo;              // Vencidos
          if (index === 1) return naranja;           // Mes actual
          if (index === 2 || index === 3) return amarillo; // Próximos 2 meses
          return verde;                              // Más lejanos
        });

        const borderColors = data.map((_, index) => {
          if (index === 0) return bordeRojo;
          if (index === 1) return bordeNaranja;
          if (index === 2 || index === 3) return bordeAmarillo;
          return bordeVerde;
        });

        const borderWidth = data.map((_, index) =>
          index <= 3 ? 3 : 1
        );
        this.barChartDataVencimiento = {
          labels: labels,
          datasets: [
            {
              label: 'Número de Medicamento',
              data: data,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: borderWidth,
              borderRadius: 6
            }
          ]
        };

        this.barChartOptionsVertical = {
          responsive: true,
          animation: {
            duration: 1200,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                afterLabel: (context: any) => {
                  if (context.dataIndex === data.length - 1) {
                    return 'Mes actual';
                  }
                  return '';
                }
              }
            }
          }
        };
      });

  }


  public async buscarRegistro(id: number) {
    this.cargarEstadistica();
  }



  // Opciones generales (todas iguales)
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  // 📊 Barras
  public barChartDataHorizontal: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: '' },
      { data: [], label: '' }
    ]
  };

  // 📊 Barras
  public barChartDataTop: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: '' },
      { data: [], label: '' }
    ]
  };

  // 📊 Barras
  public barChartDataTopPendiente: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: '' },
      { data: [], label: '' }
    ]
  };

  // 📊 Barras
  public barChartDataVertical: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: '' },
      { data: [], label: '' }
    ]
  };

  // 📊 Barras
  public barChartDataNoReclamdas: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: '' },
      { data: [], label: '' }
    ]
  };

  // 📊 Barras
  public barChartDataVencimiento: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: '' },
      { data: [], label: '' }
    ]
  };

  // 🥧 Pastel
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: []
      }
    ]
  };


  // 📈 Línea
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    datasets: [
      { data: [5, 15, 10, 22], label: 'Items entregados' }
    ]
  };

  // 🍩 Dona
  public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [
      { data: [] }
    ]
  };


  public barChartOptionsHorizontal: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de fórmulas mes seleccionado',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
    }
  };


  public barChartOptionsVertical: ChartConfiguration<'bar'>['options'] = {

    responsive: true,
    indexAxis: 'x',
    plugins: {
      legend: {
        display: false,
        position: 'bottom', // <--- Esto coloca la leyenda abajo
      }
    },
    scales: {
      x: {
        stacked: true, // <--- ESTO ES LO QUE FALTA
        title: {
          display: true,
          text: 'Meses',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
      }
    }
  };


  public barChartOptionsTop: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',

    plugins: {
      legend: { display: false },

      tooltip: {
        callbacks: {
          title: function (context) {
            return context[0].label; // nombre completo
          },
          label: function (context) {
            return `Prescripciones: ${context.raw}`;
          }
        }
      }
    },

    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Número de Prescripciones mes seleccionado',
          font: {
            size: 13,
            weight: 'bold'
          }
        }
      },

      y: {
        ticks: {
          autoSkip: false,
          font: {
            size: 10
          },
          callback: function (value: any) {
            const label = this.getLabelForValue(value as number);
            return label.length > 25
              ? label.substring(0, 25) + '...'
              : label;
          }
        }
      }
    },

    layout: {
      padding: {
        left: 20
      }
    },

    datasets: {
      bar: {
        barPercentage: 0.6,
        categoryPercentage: 0.6
      }
    }
  };


  public barChartOptionsTopPendiente: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',

    plugins: {
      legend: { display: false },

      tooltip: {
        callbacks: {
          title: function (context) {
            return context[0].label; // nombre completo
          },
          label: function (context) {
            return `pendientes: ${context.raw}`;
          }
        }
      }
    },

    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: 'Número de pendientes mes seleccionado',
          font: {
            size: 13,
            weight: 'bold'
          }
        }
      },

      y: {
        ticks: {
          autoSkip: false,
          font: {
            size: 10
          },
          callback: function (value: any) {
            const label = this.getLabelForValue(value as number);
            return label.length > 25
              ? label.substring(0, 25) + '...'
              : label;
          }
        }
      }
    },
    layout: {
      padding: {
        left: 20
      }
    },
    datasets: {
      bar: {
        barPercentage: 0.6,
        categoryPercentage: 0.6
      }
    }
  };

  public barChartOptionsVencimiento: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    indexAxis: 'x',

    onHover: (event: any, elements: any) => {
      const target = event?.native?.target;
      if (target) {
        target.style.cursor = elements.length ? 'pointer' : 'default';
      }
    },

    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const label = this.barChartDataVencimiento.labels?.[index] as string;

        this.mostrarDetalleMedicamentoVencido(label, index);
      }
    },

    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Meses',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
    }
  };



  mostrarDetalleMedicamentoVencido(label: string, index: number) {
    console.log('llegue a mostrar medicamentos vencidos de ', label);
    if (!this.listaVencidos?.length) {
      const fechaActual = new Date();
      const dateVencidos = new Date(fechaActual);
      dateVencidos.setMonth(fechaActual.getMonth() + 6);
      this.servicio.getMedicamentosVencidos(
        this.parametro,
        dateVencidos.toISOString().split('T')[0]
      )
        .subscribe(detalle => {
          console.log('estos son los medicamentos vencidos', detalle)
          this.listaVencidos = detalle.sort(
            (a: any, b: any) => a.nombre.localeCompare(b.nombre)
          );
          const filtrados = this.filtrarPorIndex(index);
          this.renderSwalDetalle(label, filtrados, index);
        });
    } else {
      const filtrados = this.filtrarPorIndex(index);
      this.renderSwalDetalle(label, filtrados, index);
    }
  }

  renderSwalDetalle(label: string, detalle: any[], index: number) {

    const colorTitulo = this.getColorPorIndex(index);

    let html = `
    <div style="text-align:left; max-height:350px; overflow:auto;">
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom:1px solid #ccc;">
            <th style="text-align:left;">Medicamento</th>
            <th style="text-align:center;">Cantidad</th>
            <th style="text-align:center;">Fecha Venc.</th>
          </tr>
        </thead>
        <tbody>
  `;

    detalle.forEach((item: any) => {

      const hoy = new Date();
      const fecha = new Date(item.fechaVencimiento);
      const colorFecha = fecha <= hoy ? '#dc3545' : '#333';

      html += `
      <tr style="border-bottom:1px solid #eee;">
        <td>${item.nombre}</td>
        <td style="text-align:center; font-weight:bold;">${item.cantidad}</td>
        <td style="text-align:center; color:${colorFecha};">
          ${item.fechaVencimiento}
        </td>
      </tr>
    `;
    });

    html += `</tbody></table></div>`;

    Swal.fire({
      title: `<span style="color:${colorTitulo}; font-weight:bold;">
              Detalle ${label}
            </span>`,
      html: html,
      width: 800,
      confirmButtonColor: colorTitulo
    });
  }

  filtrarPorIndex(index: number): any[] {

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // normalizamos

    // 🔴 0 = VENCIDOS (hasta hoy)
    if (index === 0) {
      return this.listaVencidos.filter((item: any) => {
        const fecha = new Date(item.fechaVencimiento);
        fecha.setHours(0, 0, 0, 0);
        return fecha <= hoy;
      });
    }

    // 📅 Base del mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    inicioMes.setMonth(inicioMes.getMonth() + (index - 1));

    const finMes = new Date(inicioMes);
    finMes.setMonth(finMes.getMonth() + 1);

    // 🟠 Caso especial: mes actual (index 1)
    if (index === 1) {
      const manana = new Date(hoy);
      manana.setDate(hoy.getDate() + 1);

      return this.listaVencidos.filter((item: any) => {
        const fecha = new Date(item.fechaVencimiento);
        fecha.setHours(0, 0, 0, 0);

        return fecha >= manana && fecha < finMes;
      });
    }

    // 🟡🟢 Meses futuros normales
    return this.listaVencidos.filter((item: any) => {
      const fecha = new Date(item.fechaVencimiento);
      fecha.setHours(0, 0, 0, 0);

      return fecha >= inicioMes && fecha < finMes;
    });
  }


  private getColorPorIndex(index: number): string {

    if (index === 0) return '#dc3545';        // 🔴 rojo
    if (index === 1) return '#fd7e14';        // 🟠 naranja
    if (index === 2 || index === 3) return '#ffc107'; // 🟡 amarillo
    return '#28a745';                         // 🟢 verde
  }


  tieneAcceso(nivelRequerido: number): boolean {
    const nivelUsuario = Number(sessionStorage.getItem("nivel"));
    if (isNaN(nivelUsuario)) {
      //console.warn("El nivel del usuario no es válido o no está definido");
      return false;
    }
    return nivelUsuario >= nivelRequerido;
  }

}
