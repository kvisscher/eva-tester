import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { EvaContextMenuComponent } from './context-menu.component';
import { ContextMenuController } from './context-menu';
import {CommonModule} from '@angular/common';
import { ContextMenuRef } from './context-menu-ref';

@NgModule({
  imports: [ CommonModule, OverlayModule ],
  exports: [],
  declarations: [EvaContextMenuComponent],
  entryComponents: [EvaContextMenuComponent],
  providers: [ ContextMenuController, ContextMenuRef ]
})
export class EvaContextMenuModule { }
