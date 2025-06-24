import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { MensajeI } from '../modelos/mensaje.model';
import { throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {   
  
   private urlEndPoint: string = environment.urlWhatsapp+'/lead';   

  constructor(private http: HttpClient) { }  

  public enviarMensaje(mensaje: MensajeI) {
    const headers = { 'Content-Type': 'application/json' };   
    return this.http.post<MensajeI>(this.urlEndPoint, JSON.stringify(mensaje), { headers }).pipe(
      catchError(e => {
        return throwError(e);
      })
    );
  }

}
