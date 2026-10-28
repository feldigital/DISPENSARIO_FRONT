
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DonacionService } from 'src/app/servicios/donacion.service';
import { Donacion } from 'src/app/modelos/donacion.model';
import Swal from 'sweetalert2';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-graciadonaton',
  standalone: true,
  imports: [CommonModule, FormsModule,MatIconModule],   
  templateUrl: './graciadonaton.component.html',
  styleUrls: ['./graciadonaton.component.css']
})
export class GraciadonatonComponent implements OnInit {
 donaciones: Donacion[] = [];
 donacionesFiltradas: Donacion[] = [];
 modoventa:boolean=false;
 guardando: boolean = false;
  
  // Filtros activos
  categoriaSeleccionada: string = 'Todas';
  estadoSeleccionado: 'todos' | 'pendiente' | 'apartado' | 'vendido' = 'todos';

  // Contadores para las etiquetas de filtro por estado
  contadorEstados = {
    todos: 0,
    pendiente: 0,
    apartado: 0,
    vendido: 0
  };

  // Listado predefinido de Ministerios
 listaMinisterios: string[] = [
    'Alejandro y Jenny',
    'Ana Castro',
    'Carlos y Azeneth',
    'Edwin y Sindy',
    'Elias y Maryuris',
    'Felipe y Aleydis',
    'Jaider y Sandra',
    'Jaime y Milena',
    'Jose luis y Martha',
    'Jose y Yeni',
    'Luis Fernando y Johanna',
    'Milciades y Diana',
    'Min. Jovenes',
    'Monica Charris',
    'Pastor Camilo y Viviana',
    'Victor y Diana'
  ];

  // Listado predefinido de Categorías
  listaCategorias: string[] = [
    'Todas',
    'Ropa y Calzado',
    'Electrodomésticos',
    'Hogar y Decoración',
    'Tecnología y Electrónica',
    'Libros y Papelería',
    'Juguetes y Juegos',
    'Instrumentos Musicales',
    'Herramientas',
    'Otros'
  ];

  categoriasFiltro: string[] = ['Todas'];

  mostrarFormularioAdmin = false;
  archivoSeleccionado: File | null = null;

  // Variables para el Modal de Apartado
  productoSeleccionado: Donacion | null = null;
  esModoCompra: boolean = false;
  nombrePersona: string = '';
  celularPersona: string = '';

  // Cronómetro al 18/09/2026 a las 7:00 PM (19:00 hrs)
  targetDate: Date = new Date(2026, 8, 18, 19, 0, 0); // Mes 8 es Septiembre (0-indexed)
  timerInterval: any;
  cuentaRegresiva = {
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0
  };

  nuevaDonacion: Donacion = {
    nombreProducto: '',
    tipoProducto: 'usado',
    descripcion: '',
    valor: 0,
    estado: 'pendiente',
    categoria: '',
    ministerio: '',
    donante: '',
    celularDonante: ''
  };

  constructor(private donacionService: DonacionService) {}

  ngOnInit(): void {
    this.cargarDonaciones();
    this.iniciarCronometro();
    this.categoriasFiltro =this.listaCategorias;
    
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  iniciarCronometro(): void {
    const actualizar = () => {
      const ahora = new Date().getTime();
      const distancia = this.targetDate.getTime() - ahora;

      if (distancia < 0) {
        this.cuentaRegresiva = { dias: 0, horas: 0, minutos: 0, segundos: 0 };
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }

      this.cuentaRegresiva.dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
      this.cuentaRegresiva.horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.cuentaRegresiva.minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
      this.cuentaRegresiva.segundos = Math.floor((distancia % (1000 * 60)) / 1000);
    };

    actualizar();
    this.timerInterval = setInterval(actualizar, 1000);
  }

  cargarDonaciones(): void {
    this.donacionService.obtenerTodas().subscribe({
      next: (data) => {
        this.donaciones = data;
       // this.actualizarCategoriasFiltro();
        this.calcularContadorEstados();
        this.aplicarFiltros();
      },
      error: (err) => console.error('Error al cargar artículos:', err)
    });
  }

  calcularContadorEstados(): void {
    this.contadorEstados = {
      todos: this.donaciones.length,
      pendiente: this.donaciones.filter(d => d.estado === 'pendiente').length,
      apartado: this.donaciones.filter(d => d.estado === 'apartado').length,
      vendido: this.donaciones.filter(d => d.estado === 'vendido').length
    };
  }

  actualizarCategoriasFiltro(): void {
    const catsRegistradas = new Set(this.donaciones.map(d => d.categoria).filter(c => !!c));
    const todasLasCats = new Set([...this.listaCategorias, ...Array.from(catsRegistradas)]);
    this.categoriasFiltro = ['Todas', ...Array.from(todasLasCats)];   
  }

  filtrarPorCategoria(cat: string): void {
    this.categoriaSeleccionada = cat;
    this.aplicarFiltros();
  }

  filtrarPorEstado(estado: 'todos' | 'pendiente' | 'apartado' | 'vendido'): void {
    this.estadoSeleccionado = estado;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.donacionesFiltradas = this.donaciones.filter(item => {
      // Filtro Categoría
      const cumpleCategoria = this.categoriaSeleccionada === 'Todas' || item.categoria === this.categoriaSeleccionada;
      
      // Filtro Estado
      const cumpleEstado = this.estadoSeleccionado === 'todos' || item.estado === this.estadoSeleccionado;

      return cumpleCategoria && cumpleEstado;
    });
  }

  onFileChange(event: any): void {
    if (event.target.files.length > 0) {
      this.archivoSeleccionado = event.target.files[0];
    }
  }

 guardar(): void {

  // 1. Evitar ejecuciones si ya se está procesando una solicitud
  if (this.guardando) {
    return;
  }
this.guardando = true;

    // 1. Validar que se haya seleccionado un archivo
    if (!this.archivoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Imagen requerida',
        text: 'Por favor adjunta una imagen para el artículo.',
      });
      this.guardando = false;
      return;
    }

    // 2. Validar que el archivo sea una imagen
    if (!this.archivoSeleccionado.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo no válido',
        text: 'El archivo seleccionado debe ser una imagen (JPG, PNG, WEBP, JFIF, etc.).',
      });
       this.guardando = false;
      return;
    }

    // 3. Validar campos de texto obligatorios
    if (
      !this.nuevaDonacion.nombreProducto?.trim() || 
      !this.nuevaDonacion.categoria?.trim() || 
      !this.nuevaDonacion.ministerio?.trim() ||
      !this.nuevaDonacion.donante?.trim() ||
      !this.nuevaDonacion.celularDonante?.trim()
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos obligatorios (*).',
      });
       this.guardando = false;
      return;
    }

     Swal.fire({
              title: 'Cargando tu donacion...',
              html: 'Espera un momento',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });

    // 4. Enviar datos al servicio
    this.donacionService.crearDonacion(this.nuevaDonacion, this.archivoSeleccionado).subscribe({
      next: () => {
         this.guardando = false;
         Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
        Swal.fire({
          icon: 'success',
          title: '¡Excelente!',
          text: 'El artículo fue creado correctamente. Gracias por tu donación.',
        });
        this.cargarDonaciones();
        this.mostrarFormularioAdmin = false;
        this.resetForm();
      },
      error: (err) => {
        this.guardando = false;
        Swal.close(); // ✅ Cerrar el spinner al terminar correctamente
        console.error('Error al guardar donación:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al intentar guardar la donación.',
        });
      }
    });
  }

  resetForm(): void {
    this.nuevaDonacion = {
      nombreProducto: '',
      tipoProducto: 'nuevo',
      descripcion: '',
      valor: 0,
      estado: 'pendiente',
      categoria: '',
      ministerio: '',
      donante: '',
      celularDonante: ''
    };
    this.archivoSeleccionado = null;
  }

  abrirModalApartar(donacion: Donacion): void {
    this.productoSeleccionado = donacion;   
    this.esModoCompra = false;
    this.limpiarFormularioModal();   
  }

limpiarFormularioModal(): void {
    this.nombrePersona = '';
    this.celularPersona = '';
  }


activarVenta(): void {
  this.modoventa = !this.modoventa;

  
}

cerrarModal(): void {
    this.productoSeleccionado = null;
    this.esModoCompra = false;
    this.limpiarFormularioModal();
  }

  confirmarApartado(): void {
    if (!this.nombrePersona || !this.celularPersona) {
      alert('Debes ingresar tu nombre y celular');
      return;
    }

    if (this.productoSeleccionado && this.productoSeleccionado.id) {
      this.donacionService.apartarProducto(
        this.productoSeleccionado.id, 
        this.nombrePersona, 
        this.celularPersona
      ).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDonaciones();
           Swal.fire({
                  icon: 'info',
                  title: 'Ok',
                  text: 'El Articulo fue apartado correctamente, solo tendra 24 horas para haercarse y generar el pago, despues esta nuevamente disponible para que otra persona lo adquiera.',
                });

        },
        error: (err) => console.error('Error al apartar:', err)
      });
    }
  
  }

 abrirModalCompra(donacion: Donacion): void {
    this.productoSeleccionado = donacion;  
    this.esModoCompra = true;
    this.limpiarFormularioModal();
  }

 
  confirmarCompra(): void {
    if (!this.nombrePersona || !this.celularPersona) {
      alert('Debes ingresar tu nombre y celular');
      return;
    }

    if (this.productoSeleccionado && this.productoSeleccionado.id) {
      this.donacionService.comprarProducto(
        this.productoSeleccionado.id, 
        this.nombrePersona, 
        this.celularPersona
      ).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDonaciones();
           Swal.fire({
                 icon: 'success',
                 title: '¡Excelente!',
                  text: 'Gracias por tu compra, El Articulo fue adquirido correctamente, con tu compra estas  bendiciendo la iglesia.',
                });

        },
        error: (err) => console.error('Error al comprar el articulo:', err)
      });
    }
  
  }

  eliminarArticulo(donacion: any): void { 
  const producto = donacion || this.productoSeleccionado;

  if (producto && producto.id) {
    Swal.fire({
      title: '¿Desea eliminar?',
      text: `¿Está seguro de quitar el artículo "${producto.nombreProducto}" de la parrilla de la venta de garaje donado por "${producto.donante}"? Ya no estará disponible para la oferta.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.donacionService.eliminarProducto(producto.id).subscribe({
          next: () => {
            this.cargarDonaciones();
            Swal.fire({
              icon: 'success',
              title: '¡OK!',
              text: 'El artículo fue eliminado correctamente, gracias por su intención de donarlo.'
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.mensaje || err?.mensaje || 'No se pudo eliminar el artículo.'
            });
          }
        });
      }
    });
  }
}
  
 
abrirModalEditar(item: any): void {
  let nuevaFotoFile: File | null = null;

  Swal.fire({
    title: 'Editar Producto',
    html: `
      <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
        <label style="font-weight: bold; font-size: 0.9rem;">Nombre del Producto:</label>
        <input id="swal-nombre" class="swal2-input" style="margin: 0; width: 100%;" value="${item.nombreProducto || ''}">

        <label style="font-weight: bold; font-size: 0.9rem; margin-top: 8px;">Descripción:</label>
        <textarea id="swal-descripcion" class="swal2-textarea" style="margin: 0; width: 100%; height: 80px;" placeholder="Ingresa la descripción">${item.descripcion || ''}</textarea>

        <label style="font-weight: bold; font-size: 0.9rem;">Precio del Producto:</label>
        <input id="swal-valor" class="swal2-input" style="margin: 0; width: 100%;" value="${item.valor || ''}">

        <label style="font-weight: bold; font-size: 0.9rem; margin-top: 8px;">Nueva Imagen (Opcional):</label>
        <input type="file" id="swal-file" accept="image/*" class="swal2-file" style="margin: 0; width: 100%;">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar Cambios',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#d33',
    didOpen: () => {
      const fileInput = document.getElementById('swal-file') as HTMLInputElement;
      fileInput?.addEventListener('change', (event: any) => {
        if (event.target.files && event.target.files.length > 0) {
          const file = event.target.files[0];
          if (file.type.startsWith('image/')) {
            nuevaFotoFile = file;
          } else {
            Swal.showValidationMessage('El archivo debe ser una imagen válida (JPG, PNG, WEBP, etc.)');
            fileInput.value = '';
            nuevaFotoFile = null;
          }
        }
      });
    },
    preConfirm: () => {
      const nombre = (document.getElementById('swal-nombre') as HTMLInputElement).value;
      const descripcion = (document.getElementById('swal-descripcion') as HTMLTextAreaElement).value;
      const valor = (document.getElementById('swal-valor') as HTMLInputElement).value;
      if (!nombre.trim()) {
        Swal.showValidationMessage('El nombre del producto es obligatorio');
        return false;
      }

       if (!valor.trim()) {
        Swal.showValidationMessage('El valor del producto es obligatorio y mayor que cero (0)');
        return false;
      }

      return {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        valor: valor.trim(),
        archivo: nuevaFotoFile
      };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      this.actualizarProducto(item, result.value);
    }
  });
}

actualizarProducto(itemOriginal: any, datosActualizados: { nombre: string, descripcion: string, valor: string, archivo: File | null }): void {
  const formData = new FormData();
  formData.append('id', itemOriginal.id.toString());
  formData.append('nombreProducto', datosActualizados.nombre);
  formData.append('descripcion', datosActualizados.descripcion);
  formData.append('valor', datosActualizados.valor);
  

  
  if (datosActualizados.archivo) {
    formData.append('foto', datosActualizados.archivo);
  }

  // Llamada al servicio
  this.donacionService.actualizarDonacion(formData).subscribe({
    next: (donacionActualizada: any) => {
      // Actualizamos los datos locales para que se reflejen en tiempo real
      itemOriginal.nombreProducto = donacionActualizada.nombreProducto;
      itemOriginal.descripcion = donacionActualizada.descripcion;
      itemOriginal.valor = donacionActualizada.valor;
      if (donacionActualizada.foto) {
        itemOriginal.foto = donacionActualizada.foto;
      }

      Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'El producto ha sido modificado correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
    },
    error: (err) => {
      console.error('Error al actualizar:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron guardar los cambios.'
      });
    }
  });
}

}