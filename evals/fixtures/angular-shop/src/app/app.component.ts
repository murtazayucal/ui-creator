import { Component, signal } from "@angular/core";
import { Product } from "./product";
import { ProductCardComponent } from "./product-card.component";

@Component({
  selector: "app-root",
  imports: [ProductCardComponent],
  template: `
    <main>
      <header class="page-head">
        <h1>Popular this week</h1>
        <p class="muted" aria-live="polite">Cart: {{ cart().length }}</p>
      </header>
      <section class="grid" aria-label="Popular products">
        @for (p of products; track p.id) {
          <app-product-card [product]="p" (add)="addToCart(p.id)" />
        }
      </section>
    </main>
  `,
})
export class AppComponent {
  products: Product[] = [
    { id: 1, title: "Trail Running Shoes", description: "Lightweight grip for wet rock and loose gravel.", price: 129, hue: 200 },
    { id: 2, title: "Insulated Bottle", description: "Keeps drinks cold for 24 hours.", price: 34, hue: 150 },
    { id: 3, title: "Merino Base Layer With Extended Sleeves For Cold Mornings", description: "Warm when wet, never itchy.", price: 79, hue: 20 },
    { id: 4, title: "Headlamp", description: "400 lumens, rechargeable, 60 g.", price: 49, hue: 50 },
  ];
  cart = signal<number[]>([]);

  addToCart(id: number) {
    this.cart.update((c) => [...c, id]);
  }
}
