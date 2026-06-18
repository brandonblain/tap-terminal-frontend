import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ProductService } from './products.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);

  products: any[] = [];
  productForm!: FormGroup;
  
  searchTerm: string = '';     
  isLoading: boolean = false;   

  // Flags para controlar la apertura/cierre de los modales en el HTML
  showDetailModal = false;
  showAddModal = false;
  showDeleteModal = false; 
  
  selectedProduct: any = null; // Alimenta el modal de "Ver Detalle"
  productToDelete: any = null; // Alimenta el modal de "Confirmar Eliminación"
  
  isEditMode = false;
  editingProductId: string | null = null;

  ngOnInit(): void {
    this.loadProducts();
    this.initForm();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      brand: ['', [Validators.required, Validators.maxLength(255)]],
      price: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  /**
   * 📊 LEER (Read): Carga los productos desde Render NoSQL
   */
  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar insumos de Render:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredProducts(): any[] {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return this.products;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.products.filter(p => {
      const code = p.code ? String(p.code).toLowerCase() : '';
      const name = p.name ? String(p.name).toLowerCase() : '';
      const brand = p.brand ? String(p.brand).toLowerCase() : '';
      return code.includes(term) || name.includes(term) || brand.includes(term);
    });
  }

  get showEmptyState(): boolean {
    return this.filteredProducts.length === 0 && !this.isLoading;
  }

  /**
   * 👁️ MOSTRAR DETALLE (Show)
   */
  verDetalle(product: any): void {
  console.log('👁️ Click en Detalle. Producto recibido:', product);
  this.selectedProduct = product;
  this.showDetailModal = true;
  console.log('Estado del modal detalle:', this.showDetailModal);
  }

  /**
   * PREPARAR MODAL PARA CREACIÓN
   */
  openAddModal(): void {
    this.isEditMode = false;
    this.editingProductId = null;
    this.productForm.reset({ price: 0 });
    this.showAddModal = true;
  }

  /**
   * ✏️ PREPARAR MODAL PARA EDICIÓN
   */
  openEditModal(product: any): void {
    this.isEditMode = true;
    this.editingProductId = product.id || product._id; // Mapea el _id de MongoDB heredado
    this.productForm.patchValue({
      name: product.name,
      brand: product.brand,
      price: product.price
    });
    this.showAddModal = true;
  }

  /**
   * PREPARAR MODAL DE BORRADO
   */
  openDeleteModal(product: any): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  closeModales(): void {
    this.showDetailModal = false;
    this.showAddModal = false;
    this.showDeleteModal = false;
    this.selectedProduct = null;
    this.productToDelete = null;
  }

  /**
   * ➕ / ✏️ PROCESAR ALTA Y EDICIÓN (Create / Update)
   */
  onFormSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    if (this.isEditMode) {
      // ✏️ CASO: EDICIÓN DE PRODUCTO EXISTENTE
      this.productService.updateProduct(this.editingProductId!, this.productForm.value).subscribe({
        next: () => {
          this.loadProducts(); // Recarga la tabla con los datos frescos de Render
          this.closeModales();
        },
        error: (err) => {
          console.error('Error al actualizar el producto en la API:', err);
          this.isLoading = false;
        }
      });
    } else {
      // ➕ CASO: ALTA DE NUEVO PRODUCTO (¡Aquí faltaba el else!)
      this.productService.createProduct(this.productForm.value).subscribe({
        next: () => {
          this.loadProducts(); // Recarga la tabla para ver el nuevo producto arriba
          this.closeModales();
        },
        error: (err) => {
          console.error('Error al registrar el producto en la API:', err);
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * 🗑️ ELIMINAR (Delete)
   */
  confirmarEliminar(): void {
    if (!this.productToDelete) return;
    this.isLoading = true;
    const id = this.productToDelete.id || this.productToDelete._id;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.loadProducts(); // Remueve la fila al confirmar la respuesta de Render
        this.closeModales();
      },
      error: (err) => {
        console.error('Error al desincorporar el insumo:', err);
        this.isLoading = false;
      }
    });
  }

  downloadPDF(): void {
    const doc = new jsPDF();
    doc.text('GRUPO TAP - CATALOGO DE PRODUCTOS TERMINAL', 14, 15);
    const tableRows = this.filteredProducts.map(p => [p.code, p.name, p.brand, `$${p.price}`]);
    autoTable(doc, { 
      head: [['Código', 'Producto', 'Marca', 'Precio']], 
      body: tableRows, 
      startY: 25, 
      headStyles: { fillColor: [17, 17, 17] } 
    });
    doc.save(`reporte_productos_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  downloadExcel(): void {
    const cleanedData = this.filteredProducts.map(p => ({ 'Código': p.code, 'Producto': p.name, 'Marca': p.brand, 'Precio': p.price }));
    const worksheet = XLSX.utils.json_to_sheet(cleanedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    XLSX.writeFile(workbook, `reporte_productos_${new Date().toISOString().slice(0,10)}.xlsx`);
  }
}