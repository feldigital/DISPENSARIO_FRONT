export interface Donacion {
  id?: number;
  nombreProducto: string;
  tipoProducto: 'nuevo' | 'usado';
  descripcion: string;
  valor: number;
  estado: 'pendiente' | 'apartado' | 'vendido';
  ministerio?: string;
  donante?: string;
  celularDonante?: string;
  foto?: string;
  fechaApartado?: Date;
  nombreApartado?: string;
  celularApartado?: string;
  categoria: string;
  comprador?: string;
  celularComprador?: string;
}
