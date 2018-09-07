import { Component,
         OnInit,
         Output,
         Input,
         EventEmitter,
         ElementRef,
         HostListener,
         HostBinding
} from '@angular/core';

import {
  isElement,
  isNil
} from 'lodash';

export type TDirection = 'x' | 'y' | 'z';

export interface IDimensions {
  /** The width of the element in context */
  width?: number;
  /** the height of the element in context */
  height?: number;
}


/**
 * This dragging component can be used to change width/height on any element its provided width
 *
 * usage:
 *
 * <div #resizable></div>
 * <eva-drag [elem]="#resizable" direction="x|y|z">
 */
@Component({
  selector: 'eva-drag',
  templateUrl: './drag.component.html',
  styleUrls: ['./drag.component.scss']
})

export class DragComponent implements OnInit {

  /** The element on which the dragging will occur on */
  @Input() elem: HTMLElement;

  /** The direction at which the dragging is desired */
  @Input()
  direction: TDirection;

  /** Whether to let this component control the width and height or not, something it will do by default */
  @Input() implict = true;

  /** Whether to show the drag icon or not */
  @Input() showIcon = true;

  /** Color of the icon */
  @Input() iconColor = 'white';

  /** Whenever the drag starts */
  @Output() dragStart: EventEmitter<any> = new EventEmitter<any>();

  /** Whenever the dragging ends */
  @Output() dragEnd: EventEmitter<any> = new EventEmitter<any>();

  /** Whenever the user is dragging, we will out the width and height */
  @Output() dragging$: EventEmitter<IDimensions> = new EventEmitter<IDimensions>();

  @HostBinding('class.dragging') dragging = false;

  /** Listener reference for the drag handle */
  private listenerMove: any;

  /** Listener reference for the drag handle */
  private listenerStop: any;

  /** Value of the clientX once the drag started */
  private startingPointX: number[] = [];

  /** Value of the clientY once the drag starts*/
  private startingPointY: number[] = [];

  /** Value of both clientY and X once the drag starts */
  private startingPointZ: {clientX: number, clientY: number}[] = [];

  /** Element width */
  private elemWidth: number;

  /** Element height */
  private elemHeight: number;

  /** Value to help determine which dimension property to change */
  public xDrag: boolean;

  /** Value to help determine which dimension property to change */
  public yDrag: boolean;

  /** Value to help determine which dimension property to change */
  public zDrag: boolean;

  constructor() { }

  @HostListener('mousedown', [ '$event' ]) mousedown(event: MouseEvent) {
    if ( isElement(this.elem) ) {
      this.start(event, this.direction);
    }
  }

  ngOnInit() {

    this.checkInputs([{
        conditionToMeet: isElement(this.elem),
        // tslint:disable-next-line:max-line-length
        message: `Dragging failed, you didnt provide the eva-drag component with a DOM reference. Please use the componet like so \n \n <div #resizable></div> \n <eva-drag direction="x|y" [elem]="resizable"></eva-drag>`
      },
      {
        conditionToMeet: !isNil(this.direction),
        message: 'Direction was not provided'
      }]);

    this.listenerMove = (e: MouseEvent) => this.updateWidthHeight(e);

    this.listenerStop = () => this.stop();
  }

  private start(event: MouseEvent, direction: TDirection ) {

      this.dragStart.emit({
        direction,
        event
      });

      this.dragging = true;

      if ( direction === 'x') {
        // Pushing initial starting points
        //
        this.startingPointX.push(event.clientX);

        this.xDrag = true;
      }

      if (direction === 'y') {
        // Pushing initial starting points
        //
        this.startingPointY.push(event.clientY);

        this.yDrag = true;
      }

      if ( direction === 'z' ) {
        const { clientX, clientY } = event;
        this.startingPointZ.push( { clientX, clientY });
        this.zDrag = true;
      }

      event.preventDefault();

      document.addEventListener('mousemove', this.listenerMove);
      document.addEventListener('mouseup', this.listenerStop);
  }

 private stop() {
      // Resetting this bad boys to their original state
      //
      this.xDrag = false;
      this.yDrag = false;
      this.zDrag = false;
      this.startingPointX = [];
      this.startingPointY = [];
      this.startingPointZ = [];
      document.removeEventListener('mousemove', this.listenerMove);
      document.removeEventListener('mouseup', this.listenerStop);
      this.dragging = false;
      this.dragEnd.emit();
  }

  private updateWidthHeight(event: MouseEvent): void {
    // To avoid user select
    //
    event.preventDefault();
    // TO:DO improve the z dragging logic, as there is duplicate code in this method
    //

    const { clientHeight: height, clientWidth: width } = this.elem;

    const { clientX, clientY } = event;

    if (this.zDrag) {
      this.startingPointZ.push(event);

      this.elemWidth = width - (this.startingPointZ[0].clientX - clientX);

      this.elemHeight = height - (this.startingPointZ[0].clientY - clientY);

      if ( this.implict ) {
        this.elem.style.height = `${this.elemHeight}px`;
        this.elem.style.width = `${this.elemWidth}px`;
      }

      this.dragging$.emit({
        width: this.elemWidth,
        height: this.elemHeight
      });

      this.startingPointZ.shift();
    }

    if (this.xDrag) {
      // Storing the next clientX position for the next drag, our array has two elements at this point
      //
      this.startingPointX.push(clientX);

      // Calculating how wide the target element is going to become depending on the previous starting point and the current clientX position
      //
      this.elemWidth = width - (this.startingPointX[0] - clientX);

      // Updating the DOM reference
      //
      if ( this.implict ) {
        this.elem.style.width = `${this.elemWidth}px`;
      }

      this.dragging$.emit({
        width: this.elemWidth
      });

      // When we are done using the previous starting point, we want to remove it from the array
      //
      this.startingPointX.shift();
    }

    if (this.yDrag) {
      //  Storing the next clientY position for the next drag, our array has two elements at this point
      //
      this.startingPointY.push(clientY);

      // Calculating how high the target element is going to become depending on the previous starting point and the current clientY position
      //
      this.elemHeight = height - (this.startingPointY[0] - clientY);

      // Updating the DOM reference
      //
      if ( this.implict ) {
        this.elem.style.height = `${this.elemHeight}px`;
      }

      this.dragging$.emit({
        height: this.elemHeight
      });

      // When we are done using the previous starting point, we want to remove it from the array
      //
      this.startingPointY.shift();
    }


  }

  /**
   * Checks which inputs this component has been provided with and shows feedback based on that
   */
  private checkInputs(inputs: { conditionToMeet: boolean, message: string }[]): void {
    inputs.forEach( input => {
      if ( !input.conditionToMeet ) {
        console.error(input.message);
      }
    });
  }

}
