import { animate, keyframes, query, stagger, style, transition, trigger } from '@angular/animations';

/**
 * Contains all easing cubic beziers according to the material design spec
 * @see https://material.io/guidelines/motion/duration-easing.html#duration-easing-natural-easing-curves
 */
export const easing = {
  /**
   * The standard curve (also referred to as “ease in out”) is the most common easing curve.
   * Elements quickly accelerate and slowly decelerate between on-screen locations.
   * It applies to growing and shrinking material, among other property changes.
   */
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
  /**
   * Using the deceleration curve (also referred to as “ease out”) elements enter the screen at full velocity and slowly decelerate to a resting point.
   */
  enter: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',

  /** Using the acceleration curve (also referred to as “ease in”) elements leave the screen at full velocity. They do not decelerate when off-screen */
  leave: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)'
};

const fadeInSteps = [
  style({
    opacity: 0
  }),
  animate(`300ms ${easing.enter}`, style({
    opacity: 1
  }))
];

const fadeOutSteps = [
  animate(`300ms ${easing.leave}`, style({
    opacity: 0
  }))
];

/**
 * Fade in out animations trigger which is based on :enter and :leave life cycle events
 */
export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', fadeInSteps),
  transition(':leave', fadeOutSteps)
]);

/**
 * Fade in out animations trigger which is based on :enter life cycle events
 */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', fadeInSteps)
]);

/**
 * This animation is a bit like the jQuery slideDown animation
 */
export const slideUpDown = trigger('slideUpDown', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate(`250ms ${easing.enter}`, style({
      opacity: 1,
      height: '*'
    }))
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate(`250ms ${easing.leave}`, style({
      opacity: 0,
      height: 0
    }))
  ])
]);

/** This animation will be used for any list items to create a nice entry animation */
export const listAnimation = trigger('listAnimation', [
  transition('* => *', [
    query(':leave', [
      stagger(`100ms ${easing.leave}`, [
        animate(`300ms ${easing.leave}`, style({ opacity: 0 }))
      ])
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 }),
      stagger(`100ms ${easing.leave}`, [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate(`200ms ${easing.enter}`, keyframes([
          style({ opacity: 0, transform: 'scale(1.0)', offset: 0 }),
          style({ transform: 'scale(1.1)', offset: 0.5 }),
          style({ opacity: 1, transform: 'scale(1.0)', offset: 1.0 })
        ])),
      ])
    ], { optional: true })
  ])
]);
