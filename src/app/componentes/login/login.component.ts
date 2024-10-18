import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/servicios/auth.service';
import { BodegaService } from 'src/app/servicios/bodega.service';
import { UsuarioService } from 'src/app/servicios/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  listaregistros: any;

  constructor(
    private fb: FormBuilder,
    private servicio: BodegaService,
    private usuarioservicio: UsuarioService,
    private router: Router,
    private authservicio: AuthService,
  ) {
    this.loginForm = this.fb.group({
      idBodega: ['', [Validators.required]],
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {

    this.servicio.getRegistrosActivos()
    .subscribe((resp: any) => {
      this.listaregistros = resp;
      this.listaregistros.sort((a: any, b: any) => {
        const comparacionPorNombre = a.nombre.localeCompare(b.nombre);
        if (comparacionPorNombre === 0) {
          const comparacionPorPunto = a.puntoEntrega.localeCompare(b.puntoEntrega);
          if (comparacionPorPunto === 0) {
            return a.puntoEntrega.localeCompare(b.puntoEntrega);
          }
          return comparacionPorPunto;
        }
        return comparacionPorNombre;
      });
    },
      (err: any) => { console.error(err) }
    );
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.usuarioservicio.getRegistroId(this.loginForm.get('usuario')?.value)
      .subscribe((resp: any) => {
      // console.log(resp);
      // console.log(this.loginForm.get('password')?.value);
      // console.log(this.loginForm.get('idBodega')?.value);
        if(resp.password===this.loginForm.get('password')?.value && resp.idBodega===this.loginForm.get('idBodega')?.value){
                 
          sessionStorage.setItem("nombre", resp.nombre);
          sessionStorage.setItem("bodega", resp.idBodega);
          this.authservicio.login();
      /*    Swal.fire({
          icon: 'success',
          title: `login exitoso`,
          text: `Bienvenido `+  resp.nombre,
        });*/
        this.router.navigate(['/menu']); // Redirige al componente de menú
     
      }
      else
      {Swal.fire({
        icon: 'warning',
        title: `Verificar`,
        text: `Las credenciales suministradas no corresponden con el usuario, por favor verificar su contraseña y su dispensario`,
      });}
      },
        (err: any) => { 
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: `Error`,
            text: `El usuario ingresado no esta registrado en la base de datos!`,
          });
        }
      )
    } else {
      console.log('Form Not Valid');
      Swal.fire({
        icon: 'warning',
        title: `Verificar`,
        text: `Faltan datos en el formulario para continuar ingresar`,
      });
    }
  }
}