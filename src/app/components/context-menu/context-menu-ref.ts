import { Injectable } from '@angular/core';
import { IContextMenuConfig } from './context-menu-config';
import { Subject } from 'rxjs/Subject';

/**
 * This service will be responsible for communication between the factory function of the context menu and
 * the context menu component
 */
@Injectable()
export class ContextMenuRef {

  /** Stream to notify our parent we should be cleaned of the DOM */
  public close$: Subject<void>;

  public data: IContextMenuConfig;

  constructor() { }

  /**
   * Feed a context menu with the required data for rendering on screen
   * @param contextMenu
   */
  public feedInput(contextMenu: IContextMenuConfig ) {
    this.data = contextMenu;

    this.close$ = new Subject<void>();
  }

  /**
   * This will notify our factory that we have been closed
   */
  public dismiss() {
    this.close$.next();
  }

  /**
   * Resets this service to its original state
   */
  public reset() {
    this.close$ = null;
    this.data = null;
  }

}
