import { Component } from '@angular/core';

@Component({
  selector: 'app-estadistica',
  templateUrl: './estadistica.component.html',
  styleUrls: ['./estadistica.component.css']
})
export class EstadisticaComponent {

  menuItems = [
    { name: 'Inicio', icon: 'home', route: '/home' },
    { name: 'Paciente', icon: 'person', route: '/paciente' },
    { name: 'Medicamentos', icon: 'medication', route: '/medicamentos', submenu: [
        { name: 'Consulta', icon: 'search', route: '/medicamentos/consulta' },
        { name: 'Registro', icon: 'add', route: '/medicamentos/registro' }
      ]
    },
    { name: 'F. Farmaceutica', icon: 'local_pharmacy', route: '/farmaceutica' },
    { name: 'V. Administracion', icon: 'admin_panel_settings', route: '/administracion' },
    { name: 'Bodegas', icon: 'store', route: '/bodegas' },
    { name: 'Medicos', icon: 'doctor', route: '/medicos' },
    { name: 'Ips', icon: 'hospital', route: '/ips' },
    { name: 'Despacho', icon: 'delivery_dining', route: '/despacho' }
  ];

  constructor() { }

  ngOnInit(): void { }
}