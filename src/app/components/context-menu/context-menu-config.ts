/**
 * Represents a context menu
 */
export type TContextMenu = TPossibleMenuItems[];

/** This interface will represent the most basic context menu item */
interface IContextMenBasicItem {
  /** Text to show the user */
  title: string;

  /** Optional icon */
  icon?: string | {  value: string, color: string };

  /** Whether this item is disabled or not */
  disabled?: boolean;
}

/**
 * This interface will represent any clickable context menu items
 */
export interface IContextMenuActionItem extends IContextMenBasicItem {
  /** What to do when this item is clicked */
  handler: Function | any;

  /** Combination to execute this action*/
  keyCombo?: string;
}


/**
 * This interface will represent a divider item
 */
export interface IContextMenuDividerItem {
  /** Color of the divider */
  color?: string;
}

/**
 * This interface will represent a group menu item, this item will only be responsible for showing additional options
 */
export interface IContextMenuItemGroup extends IContextMenBasicItem {
  /** Optional children, preferrably, only one level of nesting */
  children: TPossibleMenuItems[];
}

/** All the possible menu items */
export type TPossibleMenuItems = IContextMenuActionItem | IContextMenuItemGroup | IContextMenuDividerItem;

/** Represents the required configuration for opening up a context menu */
export interface IContextMenuConfig {
    /** The menu items we want to render */
    menu: TContextMenu;
    /** The container in which we want to stay inside */
    // containerDimensions?: IDimensions;
    /** The mouse event of the right click or the x y coordinates of that event */
    event: MouseEvent | { x: number, y: number };
}
