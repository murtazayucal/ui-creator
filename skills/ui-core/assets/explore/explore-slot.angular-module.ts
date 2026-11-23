// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// @ts-nocheck
// Angular adapter for the explore comparison, for NgModule-based apps and for Angular 12 and 13.
// For an app built from standalone components (Angular 14+), use explore-slot.angular.ts instead.
// Temporary: copy it with the other explore files, delete afterwards.
//
// For the comparison:
//   1. import ExploreSlotModule into the NgModule that declares the component being explored;
//   2. move that component to <name>.current.component.ts, unchanged except for its class name and
//      selector (for example ProductCardCurrentComponent, "app-product-card-current"), and declare it in
//      the same NgModule;
//   3. make <name>.component.ts a thin wrapper with the original selector, inputs and outputs:
//
//      @Component({
//        selector: "app-product-card",
//        template: `<ui-explore-slot name="ProductCard" [original]="current" [drafts]="drafts"
//                     [bind]="{ product: product }" [on]="{ add: emitAdd }"></ui-explore-slot>`,
//      })
//      export class ProductCardComponent {
//        @Input() product!: Product;
//        @Output() add = new EventEmitter<void>();
//        current = ProductCardCurrentComponent;
//        drafts = drafts;
//        emitAdd = () => this.add.emit();
//      }
//
//   4. declare every draft component in that NgModule too (drafts are ordinary components here).
//
// On Angular 19 and later, components are standalone unless told otherwise: add `standalone: false` to
// the decorator below and to the wrapper, the current component and the drafts.
// `bind` carries inputs by name; `on` carries a handler per output name.
// All behaviour (which draft shows where, the bar, the listener) lives in explore-core.js.
import { AfterViewInit, Component, ElementRef, Input, NgModule, OnChanges, OnDestroy, Type, ViewChild, ViewContainerRef } from "@angular/core";
import * as ng from "@angular/core";
import { attach } from "./explore-core.js";

@Component({
  selector: "ui-explore-slot",
  template: "<ng-container #outlet></ng-container>",
})
export class ExploreSlotComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() name!: string;
  @Input() original!: Type<unknown>;
  @Input() drafts: Record<string, Type<unknown>> = {};
  @Input() bind: Record<string, unknown> = {};
  @Input() on: Record<string, (value: unknown) => void> = {};
  @ViewChild("outlet", { read: ViewContainerRef, static: true }) outlet!: ViewContainerRef;

  private key = "current";
  private ref = null;
  private subs = [];
  private slot = null;

  // Nothing but the host element is injected here. The component factory resolver, needed on
  // Angular 12 only, is looked up when it is used: newer Angular versions refuse it as a
  // constructor parameter.
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
    // Angular 13+ creates a component from its class; Angular 12 needs a factory.
    try {
      this.ref = this.outlet.createComponent(type);
    } catch (failed) {
      // Angular 22 no longer exports the resolver. It is looked up by a name the bundler cannot
      // follow, so the file compiles there without a warning and still finds it on Angular 12.
      const Resolver = (ng as any)[["Component", "FactoryResolver"].join("")];
      const factories = Resolver ? this.outlet.injector.get(Resolver, null) : null;
      if (!factories) throw failed;
      this.ref = this.outlet.createComponent(factories.resolveComponentFactory(type));
    }
    for (const [name, handler] of Object.entries(this.on)) {
      const output = this.ref.instance[name];
      if (output?.subscribe) this.subs.push(output.subscribe(handler));
    }
    this.push();
  }

  private push() {
    for (const [name, value] of Object.entries(this.bind)) {
      // setInput arrived in Angular 14.1; before that, assign the property.
      if (typeof this.ref.setInput === "function") this.ref.setInput(name, value);
      else this.ref.instance[name] = value;
    }
    this.ref.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.slot?.detach();
    this.subs.forEach((s) => s.unsubscribe());
  }
}

@NgModule({
  declarations: [ExploreSlotComponent],
  exports: [ExploreSlotComponent],
})
export class ExploreSlotModule {}
