import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostBinding, HostListener, Inject, Input, NgZone, OnInit, Optional } from '@angular/core';
import { get, isEmpty, isEqual } from 'lodash';
import { IContextMenuActionItem, IContextMenuItemGroup, TContextMenu, TPossibleMenuItems } from './context-menu-config';
import { ContextMenuRef } from './context-menu-ref';
import { take } from 'rxjs/operators/take';

export interface IDimensions {
  /** The width of the element in context */
  width?: number;
  /** the height of the element in context */
  height?: number;
}

/**
 * This component will be responsible for rendering a list of items in the form of a context menu
 * it will execute a handler whenever an item is selected
 * @example
 * const menu = [
 *      {title: 'Actions',
 *        icon: 'mode_edit',
 *        children: [
 *          {
 *            title: 'Copy',
 *            icon: 'content_copy',
 *            handler: () => console.log('copy clicked')
 *          },
 *          {
 *            title: 'Cut',
 *            icon: 'content_cut',
 *            handler: () => console.log('cut clicked')
 *          },
 *          {
 *            title: 'Paste',
 *            icon: 'content_paste',
 *            handler: () => console.log('paste clicked')
 *          }
 *        ]
 *      },
        {},
 *      {
 *        title: 'Action',
 *        handler: () => {}
 *      }
 *  ];
 */
@Component({
  selector: 'eva-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: [ './context-menu.component.scss' ]
})
export class EvaContextMenuComponent implements OnInit {

  /** The menu we want to render */
  @Input() menu: TContextMenu;

  /** Container dimensions, in case we want the menu to be limited to a certain space */
  @Input() containerDimensions: IDimensions;

  /** The depth of the parent, we will add up onto this, 0 will represent first item */
  @Input()
  get parentDepth(): number {
    return this._parentDepth;
  }
  set parentDepth(val) {
    this._parentDepth = val;

    this.elementDepth = (val + 1);
  }

  /** The event which launched this context menu */
  @Input()
  get event(): { x: number, y: number } {
    return this._event;
  }

  set event( event: { x: number, y: number } ) {
    if ( !isEqual(event, this._event) ) {
      this._event = event;

      if ( this.el.nativeElement && event ) {
        this.position(event);
      }
    }
  }

  /**
   * The depth of this item in the context menu hierarchy
   * this will help us position sub menus, because we need to offset them by n times the width of parent menus
   * one will represent first item
   * */
  public elementDepth = 1;

  /** Whether a sub contet menu os open or not */
  public subContextMenuOpen = false;

  /** The sub menu options */
  public subMenuItems: TPossibleMenuItems[];

  /** Hover event mouse event */
  public subMenuHoverEvent: MouseEvent;

  public isEmpty = isEmpty;

  private _event: { x: number, y: number };

  private _parentDepth = 0;

  /** Top offset of this component */
  @HostBinding('style.top.px') menuTopOffset = -9999;

  /** Left offset of this component */
  @HostBinding('style.left.px') menuLeftOffset = -9999;

  @HostListener('contextmenu', ['$event']) rightClick( event: MouseEvent )  {
    // We do not want a context menu in this context menu
    //
    event.preventDefault();
  }

  @HostListener('window:keydown.Escape', ['$event']) escape(event: KeyboardEvent ) {
    this.contextMenuService.dismiss();
  }

  @HostListener('document:click', ['$event']) docClick( event: MouseEvent ) {
    if ( !this.el.nativeElement.contains(event.target) && this.parentDepth === 0 ) {
      console.log('[context:menu] clicked outside detected, closing');
      this.contextMenuService.dismiss();
    }
  }


  constructor(
      private el: ElementRef,
      @Optional() @Inject(DOCUMENT) private _document: Document,
      private contextMenuService: ContextMenuRef,
      private zone: NgZone ) { }

  ngOnInit() {
    // If this was the top of the context menu, our data will be provided by a service
    //
    if ( this.parentDepth === 0 ) {
      this.menu = this.contextMenuService.data.menu;

      // We do not want to position the menu unless the menu items have already rendered
      // otherwise our positioning technique will consider the menu as 'empty' and it will not have the actual height it eventually gets
      // which causes issues with the bottom positioning of the menu
      //
      this.zone.onStable.pipe(take(1)).subscribe(() => {
        console.log('[context:menu] menu items rendered, positioning now ');
        this.zone.run(() => this.event = this.contextMenuService.data.event);
      });

      // If there is a container dimensions provided that we should limit our self too
      // to:do make it possible to position the context menu in a container other than the document
      //
      // if ( this.contextMenuService.data.containerDimensions ) {
      //  this.containerDimensions = this.contextMenuService.data.containerDimensions;
      // }
    }


  }

  /**
   * Positions the context menu properly
   */
  public position(event: { x: number, y: number }) {
    const { x, y } = event;

    const { clientWidth: elWidth, clientHeight: elHeight } = (this.el.nativeElement as HTMLElement);

    /** Container we want to render this menu in */
    const container = this.getContainerDimensions();

    this.menuLeftOffset = x;

    this.menuTopOffset = y;

    // Checking whether the menu should open aligned to the left or the top or not
    //
    if ( x + elWidth >= container.width ) {
      this.menuLeftOffset = x - elWidth;
      if ( this.elementDepth > 1 ) {
        this.menuLeftOffset = x - elWidth * 2;
      }
    }

    if ( (y + elHeight) >= container.height ) {
      this.menuTopOffset = y - elHeight;
    }
  }

  /**
   * Returns the container size in which we want to render the context menu.
   * This will help with positioning
   */
  public getContainerDimensions(): IDimensions {
    /** Width of the container we want to render this menu in */
    let width = 0;
    /** Height of the container we want to render this menu in */
    let height = 0;

    if ( this.containerDimensions ) {
      width = <number>get(this.containerDimensions, 'width', 0);
      height = <number>get(this.containerDimensions, 'height', 0);
    } else if ( this._document ) {
      height = this._document.body.clientHeight;
      width = this._document.body.clientWidth;
    }

    return { width, height };
  }

  /**
   * Renders the children, if there are any
   */
  public showChildren(event: MouseEvent, option: IContextMenuItemGroup): void {
    if ( get(option, 'children.length', 0) ) {

      this.subMenuItems = option.children;

      this.subContextMenuOpen = true;

      this.subMenuHoverEvent = event;
    } else {
      // Means hovered item doesnt contain any children
      //
      this.subContextMenuOpen = false;

      this.subMenuItems = null;

      this.subMenuHoverEvent = null;
    }
  }

  /**
   * Returns the x y coordinates of where we want to render the sub menu
   */
  public getSubMenuPosition(): { x: number, y: number } {
    /** The host, the current element */
    const el: Element = this.subMenuHoverEvent.srcElement;

    const clientBoundingRect: ClientRect = el.getBoundingClientRect();

    // We want the child item to be the left offset of the hovered element + its width
    //
    const x = clientBoundingRect.left + el.clientWidth;

    // We want the child item to be the top offset of the hovered element
    // - the padding top of the host component for perfect alignment on the y axis
    //
    const paddingTop = parseFloat(window.getComputedStyle(this.el.nativeElement).getPropertyValue('padding-top'));

    /** Y axis alignment of the sub menu item */
    const y = clientBoundingRect.top - paddingTop;

    return { x, y };
  }

  public onItemClick(option: IContextMenuActionItem ): void  {
    if ( !option.handler ) {
      return;
    }

    console.log('[context:menu] following option was clicked', option);

    option.handler();

    console.log('[context:menu] calling dismiss');
    this.contextMenuService.dismiss();
  }
}
