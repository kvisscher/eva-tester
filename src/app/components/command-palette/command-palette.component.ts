import { Component, HostListener, NgZone, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { searchOrders, searchProducts, searchUsers, store, getProductDetail, getOrganizationUnitsForUser } from '@springtree/eva-sdk-redux';
import { AngularFusejsOptions, FusejsPipe } from 'angular-fusejs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { debounceTime, filter, first, map } from 'rxjs/operators';
import { ILoggable, Logger } from '../../decorators/logger';
import { fadeInOut, slideUpDown } from '../../shared/animations';
import isNotNil from '../../shared/operators/is-not-nil';
import { OrganizationSelectorComponent } from '../organization-selector/organization-selector.component';
import { isEmpty } from 'lodash';
import { EndPointUrlService } from '../../services/end-point-url.service';

enum CurrentAction {
  MAINSEARCH = 0,
  PRODUCTS = 1,
  ORDERS = 2,
  USERS = 3,
  PRODUCTBARCODE = 4,
  ORGANIZATIONS = 5,
  ENDPOINTURL = 6
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
  animations: [fadeInOut, slideUpDown],
  providers: [OrganizationSelectorComponent, FusejsPipe]
})
export class CommandPaletteComponent implements OnInit, ILoggable {
  @ViewChild('input') mainSearchInput: { nativeElement: HTMLInputElement };

  @ViewChild('results') resultsContainer: { nativeElement: HTMLDivElement };

  logger: Partial<Console>;

  private _show = false;

  public get show() {
    return this._show;
  }
  public set show(show) {
    this._show = show;


    if ( show === false ) {
      this.currentAction = CurrentAction.MAINSEARCH;
      this.form.reset();
    }
  }

  public activeSearchIndex = 0;

  public searchOptions: AngularFusejsOptions = {
    keys: ['title'],
    shouldSort: true,
    threshold: 0.8,
    includeMatches: false,
    tokenize: true,
    findAllMatches: false
  };

  public actions = [
    { title: 'Search: Products', value: CurrentAction.PRODUCTS },
    { title: 'Search: Orders', value: CurrentAction.ORDERS },
    { title: 'Search: Users', value: CurrentAction.USERS },
    { title: 'Search: Product barcode', value: CurrentAction.PRODUCTBARCODE },
    { title: 'Select: Organization unit', value: CurrentAction.ORGANIZATIONS },
    { title: 'Update: End point url ', value: CurrentAction.ENDPOINTURL }
  ];

  public form = this.fb.group({
    mainSearch: []
  });

  public evaSearchResults$: Observable<IEvaSearchResult[]>;

  public evaSearchResultLoading$: Observable<boolean>;

  /** This is a reflection of the mainSearch control but debounced */
  public mainSearchTerms: Observable<string> = this.form.get('mainSearch').valueChanges
    .pipe(
      filter(() => this.currentAction === CurrentAction.MAINSEARCH),
      debounceTime(300)
    );

  public get showMainSearchResults(): boolean {
    const value: string = this.form.get('mainSearch').value as string || '';

    const showMainSearchResults = value.length > 0 && this.currentAction === CurrentAction.MAINSEARCH;

    return showMainSearchResults;
  }

  public get showEvaResults(): boolean {
    return this.currentAction !== CurrentAction.MAINSEARCH;
  }

  public get searchPlaceHolder(): string {

    let placeholder = '';

    if (this.currentAction === CurrentAction.ORDERS) {
      placeholder = 'Search orders';
    }
    if (this.currentAction === CurrentAction.PRODUCTS) {
      placeholder = 'Search products';
    }
    if (this.currentAction === CurrentAction.USERS) {
      placeholder = 'Search users';
    }
    if ( this.currentAction === CurrentAction.ORGANIZATIONS ) {
      placeholder = 'Select organization';
    }

    return placeholder;
  }

  currentAction: CurrentAction = CurrentAction.MAINSEARCH;

  constructor(
    private fb: FormBuilder,
    private zone: NgZone,
    private matSnackBar: MatSnackBar,
    private organizationSelectorComponent: OrganizationSelectorComponent,
    private fusejsPipe: FusejsPipe,
    private el: ElementRef,
    private $endPointUrlService: EndPointUrlService
  ) { }

  ngOnInit() {
    this.form.get('mainSearch')
      .valueChanges
      .pipe(
        isNotNil(),
        debounceTime(300)
      )
      .subscribe(query => {
        if (this.currentAction === CurrentAction.USERS) {
          const [action] = searchUsers.createFetchAction({
            SearchQuery: query
          });

          store.dispatch(action);

          this.evaSearchResults$ = searchUsers.getResponse$().pipe(
            isNotNil(),
            map(res => res.Result.Page),
            map(page => page.map(user => ({
              id: user.ID,
              rawObject: user,
              title: user.FullName
            } as IEvaSearchResult)))
          );

          this.evaSearchResultLoading$ = searchUsers.isFetching$();
        }
        if (this.currentAction === CurrentAction.PRODUCTS || this.currentAction === CurrentAction.PRODUCTBARCODE) {
          const [action] = searchProducts.createFetchAction({
            Query: query,
            IncludedFields: ['display_value', 'product_id', 'display_price', 'backend_id', 'barcodes']
          });

          this.evaSearchResults$ = searchProducts.getResponse$().pipe(
            isNotNil(),
            map(res => res.Products),
            map(page => {
              let productResults = page
                .map(product => ({
                  id: product.product_id,
                  rawObject: product,
                  title: product.display_value
                } as IEvaSearchResult));

              // If we are in barcode mode, we will filter out products without a filled barcodes array
              //
              if ( this.currentAction === CurrentAction.PRODUCTBARCODE ) {
                productResults = productResults.filter( product => isEmpty(product.rawObject.barcodes) === false );
              }

              return productResults;
            })
          );

          this.evaSearchResultLoading$ = searchProducts.isFetching$();

          store.dispatch(action);
        }
        if (this.currentAction === CurrentAction.ORDERS) {
          const [action] = searchOrders.createFetchAction({
            Query: query
          });

          this.evaSearchResults$ = searchOrders.getResponse$().pipe(
            isNotNil(),
            map(res => res.Result.Page),
            map(page => page.map(order => ({
              id: order.ID,
              rawObject: order,
              title: `Order ${order.ID}`
            } as IEvaSearchResult)))
          );

          this.evaSearchResultLoading$ = searchOrders.isFetching$();

          store.dispatch(action);
        }
        if (this.currentAction === CurrentAction.ORGANIZATIONS) {
          this.evaSearchResults$ = getOrganizationUnitsForUser.getResponse$().pipe(
            isNotNil(),
            map( res => res.Result ),
            map(page => {
              const organizations: IEvaSearchResult[] = page.map( organization => {
                return {
                  id: organization.ID,
                  title: organization.Name,
                  rawObject: organization
                } as IEvaSearchResult;
              });

              const fusejsSortedOrganizations = this.fusejsPipe.transform(organizations, query, this.searchOptions);

              return fusejsSortedOrganizations;
            })
          );
        }
      });
  }

  @HostListener('window:keyup.shift.p', ['$event']) onShiftP(e: KeyboardEvent) {
    e.preventDefault();

    console.log('open spotlight');

    this.show = true;

    this.zone.onStable.pipe(first()).subscribe(() => {
      this.mainSearchInput.nativeElement.focus();
    });
  }

  @HostListener('window:keydown.ArrowUp', ['$event']) onArrowUp(e: KeyboardEvent) {
    e.preventDefault();

    const resultElements = this.resultsContainer.nativeElement.querySelectorAll('a');

    if ( this.activeSearchIndex === 0 ) {
      const newIndex = resultElements.length - 1;

      this.activeSearchIndex = newIndex;
    } else {
      this.activeSearchIndex--;
    }

    resultElements[this.activeSearchIndex].scrollIntoView({ behavior: 'smooth' });

    resultElements[this.activeSearchIndex].focus();
  }

  @HostListener('window:keydown.ArrowDown', ['$event']) onArrowDown(e: KeyboardEvent) {
    e.preventDefault();

    const resultElements = this.resultsContainer.nativeElement.querySelectorAll('a');

    if ( resultElements.length - 1 === this.activeSearchIndex ) {
      this.activeSearchIndex = 0;
    } else {
      this.activeSearchIndex++;
    }

    resultElements[this.activeSearchIndex].scrollIntoView({ behavior: 'smooth' });

    resultElements[this.activeSearchIndex].focus();
  }

  @HostListener('window:keyup.Escape', ['$event']) onEscape(e: KeyboardEvent) {
    e.preventDefault();
    this.show = false;
  }


  @HostListener('document:click', ['$event']) onClick(event: MouseEvent) {
    /**
     * The path of the event which will help us see what was clicked
     * We also will check if the element has a nodename because window comes back as part of the path
     */
    const eventPath = ((event as any).composedPath() as HTMLElement[])
      .filter( element => element.nodeName );

    /** Whether this component was clicked or not */
    const commandPaletteComponentClicked: HTMLElement | null = eventPath.find( element => {
      return this.el.nativeElement === element;
    });

    if ( Boolean(commandPaletteComponentClicked) === false ) {
      this.show = false;
    }
  }

  selectMainSearchOpt(e: KeyboardEvent | MouseEvent, value: CurrentAction) {
    e.preventDefault();

    this.currentAction = value;

    this.activeSearchIndex = null;

    this.form.get('mainSearch').reset();

    this.mainSearchInput.nativeElement.focus();

    this.evaSearchResults$ = new BehaviorSubject([]).asObservable();
  }

  onResultItemClick(e: KeyboardEvent | MouseEvent, value: IEvaSearchResult) {
    e.preventDefault();

    this.show = false;

    switch (this.currentAction) {
      case CurrentAction.PRODUCTS:
      case CurrentAction.ORDERS:
      case CurrentAction.USERS:
        this.copyEvaSearchResult(value);
        break;
      case CurrentAction.PRODUCTBARCODE:
        this.copyProductBarcode(value);
        break;
      case CurrentAction.ORGANIZATIONS:
        this.organizationSelectorComponent.switchOrganization(value.id);
        break;
    }
   }

  /** Copies an eva search result item to the clipboard */
  copyEvaSearchResult(value: IEvaSearchResult) {

    this.copyToClipboard(value.id.toString());

    this.matSnackBar.open(`ID copied to clipboard`, null, { duration: 3000 });

    this.show = false;
  }

  async copyProductBarcode(value: IEvaSearchResult) {

    const barcodes = value.rawObject.barcodes;

    if ( barcodes ) {
      this.copyToClipboard(barcodes[0]);
    }
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
