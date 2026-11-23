// @ts-nocheck
// Angular adapter for the explore comparison (standalone components). Temporary: copy it with the other
// explore files, delete afterwards.
//
// For the comparison:
//   1. move the component being explored to <name>.current.component.ts, unchanged except for its class
//      name and selector (for example ProductCardCurrentComponent, "app-product-card-current");
//   2. make <name>.component.ts a thin wrapper with the original selector, inputs and outputs:
//
//      @Component({
//        selector: "app-product-card",
//        imports: [ExploreSlotComponent],
//        template: `<ui-explore-slot name="ProductCard" [original]="current" [drafts]="drafts"
//                     [bind]="{ product: product }" [on]="{ add: emitAdd }" />`,
//      })
//      export class ProductCardComponent {
//        @Input({ required: true }) product!: Product;
//        @Output() add = new EventEmitter<void>();
//        current = ProductCardCurrentComponent;
//        drafts = drafts;
//        emitAdd = () => this.add.emit();
//      }
//
// `bind` carries inputs by name; `on` carries a handler per output name.
// All behaviour (which draft shows where, the bar, the listener) lives in explore-core.js.
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, Type, ViewChild, ViewContainerRef } from "@angular/core";
import { attach } from "./explore-core.js";

@Component({
  selector: "ui-explore-slot",
  standalone: true,
  template: "<ng-container #outlet></ng-container>",
})
export class ExploreSlotComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) name!: string;
  @Input({ required: true }) original!: Type<unknown>;
  @Input() drafts: Record<string, Type<unknown>> = {};
  @Input() bind: Record<string, unknown> = {};
  @Input() on: Record<string, (value: unknown) => void> = {};
  @ViewChild("outlet", { read: ViewContainerRef, static: true }) outlet!: ViewContainerRef;

  private key = "current";
  private ref = null;
  private subs = [];
  private slot = null;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    this.render();
    this.slot = attach(this.name, this.host.nativeElement, Object.keys(this.drafts), (key) => {
      this.key = key;
      this.render();
    });
  }

  ngOnChanges() {
    if (this.ref) this.push();
  }

  private render() {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    this.outlet.clear();
    const type = this.key === "current" ? this.original : this.drafts[this.key] ?? this.original;
    this.ref = this.outlet.createComponent(type);
    for (const [name, handler] of Object.entries(this.on)) {
      const output = this.ref.instance[name];
      if (output?.subscribe) this.subs.push(output.subscribe(handler));
    }
    this.push();
  }

  private push() {
    for (const [name, value] of Object.entries(this.bind)) this.ref.setInput(name, value);
    this.ref.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.slot?.detach();
    this.subs.forEach((s) => s.unsubscribe());
  }
}
