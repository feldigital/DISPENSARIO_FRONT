/*
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Donacion } from 'src/app/modelos/donacion.model';
import { MOCK_DONACIONES } from 'src/app/modelos/donaciones-mock';

@Injectable({
  providedIn: 'root'
})
export class DonacionService {
  // Manejamos un estado reactivo local con los datos iniciales
  private donaciones$ = new BehaviorSubject<Donacion[]>(MOCK_DONACIONES);

  constructor() {}

  // Simula GET /api/donaciones
  obtenerTodas(): Observable<Donacion[]> {
    return this.donaciones$.asObservable().pipe(
      delay(400) // Simula 400ms de latencia de red
    );
  }

  // Simula POST /api/donaciones (Soporta URL simulada de archivo subido)
  crearDonacion(donacion: Donacion, foto: File | null): Observable<Donacion> {
    const listaActual = this.donaciones$.getValue();
    
    // Crear una URL temporal para la imagen seleccionada localmente
    let urlFotoSimulada = 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=500'; // fallback
    if (foto) {
      urlFotoSimulada = URL.createObjectURL(foto);
    }

    const nuevaDonacionConId: Donacion = {
      ...donacion,
      id: listaActual.length ? Math.max(...listaActual.map(d => d.id || 0)) + 1 : 1,
      foto: urlFotoSimulada,
      estado: donacion.estado || 'pendiente'
    };

    // Actualizamos el estado interno
    this.donaciones$.next([nuevaDonacionConId, ...listaActual]);

    return of(nuevaDonacionConId).pipe(delay(500));
  }

  // Simula PUT /api/donaciones/{id}/apartar
  apartarProducto(id: number, nombre: string, celular: string): Observable<Donacion> {
    const listaActual = this.donaciones$.getValue();
    let donacionActualizada!: Donacion;

    const listaNueva = listaActual.map(item => {
      if (item.id === id) {
        donacionActualizada = {
          ...item,
          estado: 'apartado',
          nombreApartado: nombre,
          celularApartado: celular,
          fechaApartado: new Date()
        };
        return donacionActualizada;
      }
      return item;
    });

    this.donaciones$.next(listaNueva);

    return of(donacionActualizada).pipe(delay(300));
  }
}
  */


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Donacion } from 'src/app/modelos/donacion.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DonacionService {
 
  private urlEndPoint = environment.apiUrl + '/donaciones';

  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<Donacion[]> {
    return this.http.get<Donacion[]>(this.urlEndPoint);
  }

  crearDonacion(donacion: Donacion, foto: File | null): Observable<Donacion> {
    const formData = new FormData();
    formData.append('donacion', JSON.stringify(donacion));
    if (foto) {
      formData.append('file', foto);
    }
    return this.http.post<Donacion>(this.urlEndPoint, formData);
  }

/*
 public actualizarDonacion(id: number, foto: File): Observable<Donacion> {
    const formData = new FormData();
    
    if (foto) {
      formData.append('foto', foto);
    }
       // Ojo con el nombre del parámetro si tu backend espera 'id' o 'idFormula'
    formData.append('idFormula', id.toString());
    // Nota: Corrige también la errata en la URL ("acrualizarimagen" -> "actualizarimagen" si aplica en tu backend)
    return this.http.put<Donacion>(`${this.urlEndPoint}/actualizarimagen`, formData);
  }*/

    public actualizarDonacion(formData: FormData): Observable<Donacion> {
    return this.http.put<Donacion>(`${this.urlEndPoint}/actualizar`, formData);
  }

  apartarProducto(id: number, nombre: string, celular: string): Observable<Donacion> {
    return this.http.put<Donacion>(`${this.urlEndPoint}/${id}/apartar?nombre=${nombre}&celular=${celular}`, {});
  }

   comprarProducto(id: number, nombre: string, celular: string): Observable<Donacion> {
    return this.http.put<Donacion>(`${this.urlEndPoint}/${id}/comprar?nombre=${nombre}&celular=${celular}`, {});
  }

eliminarProducto(id: number): Observable<Donacion> {
    return this.http.delete<Donacion>(`${this.urlEndPoint}/${id}`, {});
  }

}