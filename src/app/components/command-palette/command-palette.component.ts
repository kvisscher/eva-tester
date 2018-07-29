import { Component, HostListener, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { searchOrders, searchProducts, searchUsers, store } from '@springtree/eva-sdk-redux';
import { AngularFusejsOptions } from 'angular-fusejs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { debounceTime, filter, first, map } from 'rxjs/operators';
import { ILoggable, Logger } from '../../decorators/logger';
import { fadeInOut, slideUpDown } from '../../shared/animations';
import isNotNil from '../../shared/operators/is-not-nil';

enum CurrentSearchType {
  MAINSEARCH = 0,
  PRODUCTS = 1,
  ORDERS = 2,
  USERS = 3,
  PRODUCTBARCODE = 4
}

interface IEvaSearchResult {
  rawObject: any;
  id: number;
  title: string;
}

@Logger
@Component({
  selector: 'eva-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
  animations: [ fadeInOut, slideUpDown ]
})
export class CommandPaletteComponent implements OnInit, ILoggable {
  @ViewChild('input') mainSearchInput: { nativeElement: HTMLInputElement };

  logger: Partial<Console>;

  show = false;

  public searchOptions: AngularFusejsOptions = {
    keys: ['title'],
    shouldSort: true,
    threshold: 0.8,
    includeMatches: false,
    tokenize: true,
    findAllMatches: false
  };

  public actions = [
    {title: 'Search: Products', value: CurrentSearchType.PRODUCTS},
    {title: 'Search: Orders', value: CurrentSearchType.ORDERS},
    {title: 'Search: Users', value: CurrentSearchType.USERS},
    {title: 'Search: Product barcode', value: CurrentSearchType.PRODUCTBARCODE}
  ];

  public form = this.fb.group({
    mainSearch: []
  });

  public evaSearchResults$: Observable<IEvaSearchResult[]>;

  public evaSearchResultLoading$: Observable<boolean>;

  /** This is a reflection of the mainSearch control but debounced */
  public mainSearchTerms: Observable<string> = this.form.get('mainSearch').valueChanges
    .pipe(
      filter(() => this.currentSearchEnum === CurrentSearchType.MAINSEARCH ),
      debounceTime(300)
    );

  public get showMainSearchResults(): boolean {
    const value: string = this.form.get('mainSearch').value as string || '';

    const showMainSearchResults = value.length > 0 && this.currentSearchEnum === CurrentSearchType.MAINSEARCH;

    return showMainSearchResults;
  }

  public get showEvaResults(): boolean {
    return this.currentSearchEnum !== CurrentSearchType.MAINSEARCH;
  }

  public get searchPlaceHolder(): string {

    let placeholder = '';

    if (this.currentSearchEnum === CurrentSearchType.ORDERS) {
      placeholder = 'Search orders';
    }
    if (this.currentSearchEnum === CurrentSearchType.PRODUCTS) {
      placeholder = 'Search products';
    }
    if (this.currentSearchEnum === CurrentSearchType.USERS) {
      placeholder = 'Search users';
    }

    return placeholder;
  }

  currentSearchEnum: CurrentSearchType = CurrentSearchType.MAINSEARCH;

  constructor(
    private fb: FormBuilder,
    private zone: NgZone,
    private matSnackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.form.get('mainSearch')
      .valueChanges
      .pipe(
        isNotNil(),
        debounceTime(300)
      )
      .subscribe( query => {
        if ( this.currentSearchEnum === CurrentSearchType.USERS ) {
          const [action] = searchUsers.createFetchAction({
            SearchQuery: query
          });

          store.dispatch(action);

          this.evaSearchResults$ = searchUsers.getResponse$().pipe(
            isNotNil(),
            map(res => res.Result.Page),
            map( page => page.map( user => ({
              id: user.ID,
              rawObject: user,
              title: user.FullName
            } as IEvaSearchResult)))
          );

          this.evaSearchResultLoading$ = searchUsers.isFetching$();
        }
        if ( this.currentSearchEnum === CurrentSearchType.PRODUCTS || this.currentSearchEnum === CurrentSearchType.PRODUCTBARCODE ) {
          const [action] = searchProducts.createFetchAction({
            Query: query,
            IncludedFields: ['display_value', 'product_id', 'display_price', 'backend_id']
          });

          this.evaSearchResults$ = searchProducts.getResponse$().pipe(
            isNotNil(),
            map(res => res.Products),
            map(page => page.map(product => ({
              id: product.product_id,
              rawObject: product,
              title: product.display_value
            } as IEvaSearchResult)))
          );

          this.evaSearchResultLoading$ = searchProducts.isFetching$();

          store.dispatch(action);
        }
        if ( this.currentSearchEnum === CurrentSearchType.ORDERS ) {
          const [action] = searchOrders.createFetchAction({
            Query: query
          });

          this.evaSearchResults$ = searchOrders.getResponse$().pipe(
            isNotNil(),
            map(res => res.Result.Page),
            map( page => page.map( order => ({
              id: order.ID,
              rawObject: order,
              title: `Order ${order.ID}`
            } as IEvaSearchResult)))
          );

          this.evaSearchResultLoading$ = searchOrders.isFetching$();

          store.dispatch(action);
        }
      });
  }

  @HostListener('window:keyup.shift.p', ['$event']) shiftP(e: KeyboardEvent) {
    e.preventDefault();

    console.log('open spotlight');

    this.show = true;

    this.zone.onStable.pipe(first()).subscribe(() => {
      this.mainSearchInput.nativeElement.focus();
    });
  }

  @HostListener('window:keyup.Escape', ['$event']) esc(e: KeyboardEvent) {
    e.preventDefault();

    console.log('close spotlight');

    this.show = false;

    this.currentSearchEnum = CurrentSearchType.MAINSEARCH;

    this.form.reset();
  }

  selectMainSearchOpt(e: KeyboardEvent | MouseEvent, value: CurrentSearchType) {
    e.preventDefault();

    this.currentSearchEnum = value;

    this.form.get('mainSearch').reset();

    this.mainSearchInput.nativeElement.focus();

    this.evaSearchResults$ = new BehaviorSubject([]).asObservable();
  }

  copyEvaSearch(e: KeyboardEvent | MouseEvent, value: IEvaSearchResult) {
    e.preventDefault();

    this.copyToClipboard(value.id.toString());

    this.matSnackBar.open(`ID copied to clipboard`, null, {duration: 3000});

    this.show = false;
  }

  /**
   * @param value to copy
   * @author Sangram Nandkhile
   * @see https://stackoverflow.com/a/49121680/4047409
   */
  private copyToClipboard(value: string) {
    const copyElement = document.createElement('textarea');
    copyElement.style.position = 'fixed';
    copyElement.style.left = '0';
    copyElement.style.top = '0';
    copyElement.style.opacity = '0';
    copyElement.value = value;
    document.body.appendChild(copyElement);
    copyElement.focus();
    copyElement.select();
    document.execCommand('copy');
    document.body.removeChild(copyElement);
  }


}
