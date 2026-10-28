import { Donacion } from './donacion.model';

export const MOCK_DONACIONES: Donacion[] = [
  {
    id: 1,
    nombreProducto: 'Guitarra Acústica Yamaha',
    tipoProducto: 'usado',
    descripcion: 'En excelente estado, incluye funda y cuerdas de repuesto. Ideal para el ministerio de alabanza.',
    valor: 150.00,
    estado: 'pendiente',
    ministerio: 'Alabanza',
    donante: 'Carlos Mendoza',
    foto: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500',
    categoria: 'Instrumentos'
  },
  {
    id: 2,
    nombreProducto: 'Juego de Sala 3 Puestos',
    tipoProducto: 'usado',
    descripcion: 'Sofá tapizado en tela color gris, muy cómodo y sin manchas.',
    valor: 200.00,
    estado: 'apartado',
    nombreApartado: 'María López',
    celularApartado: '3001234567',
    fechaApartado: new Date(),
    ministerio: 'Damas',
    donante: 'Familia Ramírez',
    foto: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
    categoria: 'Hogar'
  },
  {
    id: 3,
    nombreProducto: 'Biblia de Estudio Reina Valera 1960',
    tipoProducto: 'nuevo',
    descripcion: 'Edición de lujo con mapas a color, concordancia y referencias en cuero sintético.',
    valor: 35.00,
    estado: 'pendiente',
    ministerio: 'Jóvenes',
    donante: 'Librería Cristiana',
    foto: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
    categoria: 'Libros'
  },
  {
    id: 4,
    nombreProducto: 'Bicicleta MTB Rin 29',
    tipoProducto: 'usado',
    descripcion: 'Marca GW con frenos de disco y cambios Shimano 21 velocidades.',
    valor: 180.00,
    estado: 'vendido',
    ministerio: 'Misiones',
    donante: 'Juan Pérez',
    foto: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500',
    categoria: 'Deportes'
  }
];