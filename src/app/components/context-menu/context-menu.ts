import { ElementRef, Injectable } from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';
import { Overlay, OverlayOrigin, OverlayConfig, BlockScrollStrategy } from '@angular/cdk/overlay';
import { EvaContextMenuComponent } from './context-menu.component';
import { ContextMenuRef } from './context-menu-ref';
import { IContextMenuConfig } from './context-menu-config';
import { Subject } from 'rxjs/Subject';
import { OverlayRef } from '@angular/cdk/overlay';
import { take } from 'rxjs/operators/take';

/**
 * This will serve as an interface to render a context menu component, simply inject this service in the constructor and call present on the instance of it
 */
@Injectable()
export class ContextMenuController  {

  private overlayRef: OverlayRef;

  constructor(private overlay: Overlay, private contextMenuService: ContextMenuRef) { }

  /**
   * Creates an instance of the context menu
   * returns a promise whether the context menu was opened or not
   **/
  public present(data: IContextMenuConfig, el?: ElementRef ): Promise<any> {
    // Preventing the default on the mouse event provided by the consumer incase shift wasnt pressed
    // This code will only be executed IF the event is actually a mouse event
    //
    if ( data.event instanceof Event ) {
      if ( !data.event.shiftKey ) {
        data.event.preventDefault();
      } else {
        return Promise.reject('Shift was clicked, letting default behavior override');
      }
    }

    // We only want context menu at a time, so we will dismiss any existing ones before proceeding
    //
    this.dismiss();

    // Feeding the context menu service with the data it needs
    //
    this.contextMenuService.feedInput(data);

    this.overlayRef = this.overlay.create({
      direction: 'ltr',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const contextMenuPortal = new ComponentPortal(EvaContextMenuComponent);

    this.overlayRef.attach(contextMenuPortal);

    // Listening to close events
    //
    this.contextMenuService.close$
      .pipe(take(1))
      .subscribe(() => {
        this.dismiss();
    });

    return Promise.resolve();
  }

  /**
   * Cleans up the overlay from the dom, incase its there
   **/
  public dismiss() {
    if ( this.overlayRef ) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.contextMenuService.reset();
    }
  }
}
