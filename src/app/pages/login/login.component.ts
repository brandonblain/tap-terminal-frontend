import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // 🔐 Variables originales de Login
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  // 🔄 Nuevas variables para el Modal de Recuperación (Requisito Examen)
  recoveryForm: FormGroup;
  showRecoveryModal: boolean = false;
  recoverySuccessMessage: string = '';
  recoveryErrorMessage: string = '';

  constructor() {
    // Inicialización de tu formulario de Login original
    this.loginForm = this.fb.group({
      user: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    // Inicialización del nuevo formulario reactivo de recuperación
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Envío del formulario de Login original
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Enviamos el formulario original con 'user' y 'password' tal como tu backend lo pide
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('¡Login exitoso!', res);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Credenciales incorrectas o error de servidor.';
        console.error(err);
      }
    });
  }

  /* ==========================================================================
     ⚙️ MÉTODOS CONTROLADORES PARA EL MODAL DE RECUPERACIÓN NoSQL
     ========================================================================== */

  /**
   * Abre el modal y limpia cualquier alerta vieja
   */
  openRecoveryModal(): void {
    this.recoveryForm.reset();
    this.recoverySuccessMessage = '';
    this.recoveryErrorMessage = '';
    this.showRecoveryModal = true;
  }

  /**
   * Cierra el modal de inmediato
   */
  closeRecoveryModal(): void {
    this.showRecoveryModal = false;
  }

  /**
   * Procesa la petición de restablecimiento hacia el backend en Render
   */
  onRecoverySubmit(): void {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.recoverySuccessMessage = '';
    this.recoveryErrorMessage = '';

    this.authService.recoverPassword(this.recoveryForm.value.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Mostramos el mensaje verde de éxito que manda tu Laravel
        this.recoverySuccessMessage = res.message || 'Contraseña temporal generada y enviada.';
        this.recoveryForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        
        // Si el backend de Laravel NoSQL responde con 444, el correo no existe
        if (err.status === 444) {
          this.recoveryErrorMessage = 'El correo ingresado no se encuentra registrado en el sistema TAP.';
        } else {
          this.recoveryErrorMessage = 'Ocurrió un error al procesar la solicitud. Intenta más tarde.';
        }
      }
    });
  }
}