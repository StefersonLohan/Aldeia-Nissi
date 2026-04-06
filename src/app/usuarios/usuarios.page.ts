import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

// PrimeNG Imports (v20)
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TagModule } from 'primeng/tag';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { CardModule } from 'primeng/card';

import { UsuariosService } from './usuarios.service';
import { Usuario } from './usuarios.model';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CheckboxModule,
    SelectModule,
    FloatLabelModule,
    TagModule,
    InputGroupModule,
    InputGroupAddonModule,
    CardModule
  ]
})
export class UsuariosPage implements OnInit {
  usuarios: Usuario[] = [];
  displayDialog: boolean = false;
  usuarioForm: FormGroup;
  isEditMode: boolean = false;
  selectedId: string | undefined;

  cargos = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Colaborador', value: 'colaborador' }
  ];

  constructor(
    private usuariosService: UsuariosService,
    private fb: FormBuilder,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) {
    this.usuarioForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      cargo: ['colaborador', Validators.required],
      senha: [''],
      ativo: [true]
    });
  }

  ngOnInit() {
    this.usuariosService.getUsuarios().subscribe(data => {
      this.usuarios = data;
    });
  }

  openNew() {
    this.isEditMode = false;
    this.selectedId = undefined;
    this.usuarioForm.reset({ cargo: 'colaborador', ativo: true });
    this.usuarioForm.get('senha')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.displayDialog = true;
  }

  editUsuario(usuario: Usuario) {
    this.isEditMode = true;
    this.selectedId = usuario.id;
    this.usuarioForm.patchValue({
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
      ativo: usuario.ativo,
      senha: '' // Clear password field for security
    });
    // For editing, password is not required unless changing it
    this.usuarioForm.get('senha')?.setValidators([Validators.minLength(6)]);
    this.displayDialog = true;
  }

  async deleteUsuario(usuario: Usuario) {
    if (usuario.id === 'admin') {
      const toast = await this.toastController.create({
        message: 'O administrador padrão não pode ser excluído.',
        duration: 2000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Deseja realmente remover o usuário ${usuario.nome}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          handler: () => {
            this.usuariosService.deleteUsuario(usuario.id!).subscribe(() => {
              this.showToast('Usuário removido com sucesso!');
            });
          }
        }
      ]
    });
    await alert.present();
  }

  saveUsuario() {
    if (this.usuarioForm.invalid) return;

    const formValues = this.usuarioForm.value;
    const usuario: Usuario = {
      ...formValues,
      id: this.selectedId
    };

    // If edit mode and no password entered, don't update it
    if (this.isEditMode && !formValues.senha) {
      delete usuario.senha;
    }

    this.usuariosService.saveUsuario(usuario).subscribe(() => {
      this.displayDialog = false;
      this.showToast(this.isEditMode ? 'Usuário atualizado!' : 'Usuário criado com sucesso!');
    });
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });
    toast.present();
  }
}
