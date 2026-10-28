import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-gracia',
  templateUrl: './gracia.component.html',
  styleUrls: ['./gracia.component.css']
})
export class GraciaComponent {

  facturaForm: FormGroup;

  versiculosPromesa: { texto: string; cita: string }[] = [
    { texto: 'Jehová es mi pastor; nada me faltará.', cita: 'Salmos 23:1' },
    { texto: 'Todo lo puedo en Cristo que me fortalece.', cita: 'Filipenses 4:13' },
    { texto: 'Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas que tú no conoces.', cita: 'Jeremías 33:3' },
    { texto: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.', cita: 'Isaías 41:10' },
    { texto: 'El Señor es mi luz y mi salvación; ¿de quién temeré?', cita: 'Salmos 27:1' },
    { texto: 'Bendito el hombre que confía en el Señor, y cuya confianza es el Señor.', cita: 'Jeremías 17:7' },
    { texto: 'Mi Dios, pues, suplirá todo lo que os falta conforme a sus riquezas en gloria en Cristo Jesús.', cita: 'Filipenses 4:19' },
    { texto: 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da.', cita: 'Juan 14:27' },
    { texto: 'Porque yo sé los pensamientos que tengo acerca de vosotros, pensamientos de paz y no de mal.', cita: 'Jeremías 29:11' },
    { texto: 'Echa sobre Jehová tu carga, y él te sustentará; no dejará para siempre caído al justo.', cita: 'Salmos 55:22' },
    { texto: 'Busqué a Jehová, y él me oyó, y me libró de todos mis temores.', cita: 'Salmos 34:4' },
    { texto: 'Cercano está Jehová a los quebrantados de corazón; y salva a los contritos de espíritu.', cita: 'Salmos 34:18' },
    { texto: 'Si Dios es por nosotros, ¿quién contra nosotros?', cita: 'Romanos 8:31' },
    { texto: 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.', cita: 'Mateo 11:28' },
    { texto: 'Torre fuerte es el nombre de Jehová; a él correrá el justo, y será levantado.', cita: 'Proverbios 18:10' },
    { texto: 'El da esfuerzo al cansado, y multiplica las fuerzas al que no tiene ningunas.', cita: 'Isaías 40:29' },
    { texto: 'Bueno es Jehová, fortaleza en el día de la angustia; y conoce a los que en él confían.', cita: 'Nahúm 1:7' },
    { texto: 'Bienaventurados los que lloran, porque ellos recibirán consolación.', cita: 'Mateo 5:4' },
    { texto: 'El amor es sufrido, es benigno; el amor no tiene envidia.', cita: '1 Corintios 13:4' },
    { texto: 'Jehová guardará tu salida y tu entrada desde ahora y para siempre.', cita: 'Salmos 121:8' }
  ];

  constructor(private formBuilder: FormBuilder) {
    this.facturaForm = this.formBuilder.group({
      cantidadVersiculos: [1, [Validators.required, Validators.min(1), Validators.max(5)]]
    });
  }

  obtenerVersiculosAleatorios(cantidad: number): { texto: string; cita: string }[] {
    const limite = Math.min(Math.max(cantidad, 1), 5);
    const copia = [...this.versiculosPromesa];
    const seleccionados = [];

    for (let i = 0; i < limite; i++) {
      const indexAleatorio = Math.floor(Math.random() * copia.length);
      seleccionados.push(copia[indexAleatorio]);
      copia.splice(indexAleatorio, 1);
    }

    return seleccionados;
  }

  async imprimir(): Promise<void> {
    const cantidadReq = this.facturaForm.get('cantidadVersiculos')?.value || 1;
    const versiculosSeleccionados = this.obtenerVersiculosAleatorios(cantidadReq);

    

    // Obtener fecha y hora de impresión en formato Colombia (AM/PM)
    const fechaHoy = new Date().toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const htmlVersiculos = versiculosSeleccionados.map((v, index) => `
      <div class="item-versiculo">
        <div class="num-versiculo">PROMESA #${index + 1}</div>
        <div class="texto-versiculo">"${v.texto}"</div>
        <div class="cita-versiculo">— ${v.cita}</div>
      </div>
    `).join('');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            color: #000000;
            -webkit-print-color-adjust: exact;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          
          /* Encabezado */
          .header {
            text-align: center;
            margin-bottom: 8px;
          }
          .title {
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .subtitle {
            font-size: 11px;
            margin-bottom: 2px;
          }
          .meta-info {
            font-size: 11px;
            margin-top: 4px;
          }

          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .divider-double {
            border-top: 2px solid #000;
            margin: 8px 0;
          }

          /* Versículos */
          .item-versiculo {
            margin-bottom: 10px;
            padding: 6px;
            border: 1px solid #000;
            border-radius: 4px;
          }
          .num-versiculo {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .texto-versiculo {
            font-size: 13px;
            line-height: 1.3;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .cita-versiculo {
            font-size: 11px;
            font-style: italic;
            text-align: right;
            font-weight: bold;
          }

          /* Pie de página e invitación */
          .footer {
            text-align: center;
            margin-top: 8px;
          }
          .footer-valor {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .footer-mensaje {
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
          }
          .agradecimiento {
            font-size: 12px;
            font-style: italic;
            margin: 6px 0;
          }
          .box-invitacion {
            border: 1px dashed #000;
            padding: 6px;
            border-radius: 4px;
            margin-top: 6px;
          }
          .invitacion-titulo {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 4px;
            letter-spacing: 0.3px;
          }
          .horario-item {
            font-size: 12px;
            line-height: 1.4;
          }
          .actividad {
            font-weight: bold;
          }
          
          /* Espacio para el corte térmico */
          .feed-space {
            height: 15mm;
          }
        </style>
      </head>
      <body onload="window.print(); setTimeout(function(){ window.close(); }, 500);">
        <div class="header">
          <div class="title">IGLESIA MCI SANTA MARTA</div>
          <div class="subtitle">Calle 15 # 20-17 el jardin</div>
          <div class="meta-info">
            <strong>Ministerio:</strong> FELIPE Y ALEYDIS<br>
            Fecha:</strong> ${fechaHoy}
          </div>
           <div class="subtitle">Campaña evangelistica: <strong>ABRIENDO CAMINO</strong></div>
        </div>

        <div class="divider-double"></div>

        ${htmlVersiculos}

        <div class="divider"></div>

        <div class="footer">
          <div class="footer-valor">Total a pagar: $ 0.00</div>
          <div class="footer-mensaje">¡JESUS, Ya pagó el precio!</div>
          
          <div class="divider"></div>

          <div class="agradecimiento">¡Gracias por permitirnos servirte!</div>

          <div class="box-invitacion">
            <div class="invitacion-titulo">Te invitamos a nuestras reuniones</div>
            <div class="horario-item">
              <span class="actividad">Jóvenes:</span> Sábados 5:00 PM
            </div>
            <div class="horario-item">
              <span class="actividad">Familiar:</span> Domingos 7:00 AM
            </div>
          </div>
        </div>

        <div class="feed-space"></div>
      </body>
      </html>
      `);
      doc.close();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 3000);
  }
}