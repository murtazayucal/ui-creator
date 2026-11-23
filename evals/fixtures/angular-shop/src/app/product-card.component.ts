import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Product } from "./product";

@Component({
  selector: "app-product-card",
  template: `
    <article class="card">
      <div class="media" [style.background]="'oklch(0.9 0.06 ' + product.hue + ')'" role="img" [attr.aria-label]="product.title"></div>
      <h2>{{ product.title }}</h2>
      <p class="muted">{{ product.description }}</p>
      <div class="row">
        <span class="price">\${{ product.price }}</span>
        <button type="button" class="btn" (click)="add.emit()">Add to cart</button>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() add = new EventEmitter<void>();
}
