import { Component, ElementRef, HostListener, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getOrganizationUnitsForUser, searchOrders, searchProducts, searchUsers, settings, store } from '@springtree/eva-sdk-redux';
import { AngularFusejsOptions, FusejsPipe } from 'angular-fusejs';
import { isEmpty } from 'lodash';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { debounceTime, filter, first, map } from 'rxjs/operators';
import { ILoggable, Logger } from '../../decorators/logger';
import { ClipboardService } from '../../services/clipboard.service';
import { EndPointUrlService } from '../../services/end-point-url.service';
import { fadeInOut, slideUpDown } from '../../shared/animations';
import isNotNil from '../../shared/operators/is-not-nil';
import { OrganizationSelectorComponent } from '../organization-selector/organization-selector.component';

enum CurrentAction {
  MainSearch = 0,
  ProductSearch = 1,
  OrderSearch = 2,
  UserSearch = 3,
  ProductBarcodeSearch = 4,
  OrganizationsSearch = 5,
  EndPointUrlUpdate = 6,
  EndPointUrlSearch = 7,
  UserTokenSwitch = 8
}

interface IEvaSearchResult {
  rawObject: any;
  id: any;
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
      this.currentAction = CurrentAction.MainSearch;
      this.form.reset();

      this.activeSearchIndex = null;
    }
  }

  public activeSearchIndex = null;

  public searchOptions: AngularFusejsOptions = {
    keys: ['title'],
    shouldSort: true,
    threshold: 0.8,
    includeMatches: false,
    tokenize: true,
    findAllMatches: false
  };

  public actions = [
    { title: 'Search: Products', value: CurrentAction.ProductSearch },
    { title: 'Search: Orders', value: CurrentAction.OrderSearch },
    { title: 'Search: Users', value: CurrentAction.UserSearch },
    { title: 'Search: Product barcode', value: CurrentAction.ProductBarcodeSearch },
    { title: 'Select: Organization unit', value: CurrentAction.OrganizationsSearch },
    { title: 'Update: End point url', value: CurrentAction.EndPointUrlUpdate },
    { title: 'Search: End point url', value: CurrentAction.EndPointUrlSearch },
    { title: 'Update: User token', value: CurrentAction.UserTokenSwitch }
  ];

  public form = this.fb.group({
    mainSearch: []
  });

  public evaSearchResults$: Observable<IEvaSearchResult[]>;

  public evaSearchResultLoading$: Observable<boolean>;

  /** This is a reflection of the mainSearch control but debounced */
  public mainSearchTerms: Observable<string> = this.form.get('mainSearch').valueChanges
    .pipe(
      filter(() => this.currentAction === CurrentAction.MainSearch),
      debounceTime(300)
    );

  public get showMainSearchResults(): boolean {
    const value: string = this.form.get('mainSearch').value as string || '';

    const showMainSearchResults = value.length > 0 && this.currentAction === CurrentAction.MainSearch;

    return showMainSearchResults;
  }

  public get showEvaResults(): boolean {
    return this.currentAction !== CurrentAction.MainSearch;
  }

  public get searchPlaceHolder(): string {

    let placeholder = '';

    if (this.currentAction === CurrentAction.OrderSearch) {
      placeholder = 'Search orders';
    }
    if (this.currentAction === CurrentAction.ProductSearch) {
      placeholder = 'Search products';
    }
    if (this.currentAction === CurrentAction.UserSearch) {
      placeholder = 'Search users';
    }
    if ( this.currentAction === CurrentAction.OrganizationsSearch ) {
      placeholder = 'Select organization';
    }
    if ( this.currentAction === CurrentAction.EndPointUrlSearch ) {
      placeholder = 'Select end point urls';
    }

    return placeholder;
  }

  currentAction: CurrentAction = CurrentAction.MainSearch;

  constructor(
    private fb: FormBuilder,
    private zone: NgZone,
    private matSnackBar: MatSnackBar,
    private organizationSelectorComponent: OrganizationSelectorComponent,
    private fusejsPipe: FusejsPipe,
    private el: ElementRef,
    private $endPointUrlService: EndPointUrlService,
    private $clipboardService: ClipboardService
  ) { }

  ngOnInit() {
    const mainSearchValueChanges$ = this.form.get('mainSearch')
      .valueChanges;

    mainSearchValueChanges$
      .pipe(
        isNotNil(),
        debounceTime(300)
      )
      .subscribe(query => {
        if (this.currentAction === CurrentAction.UserSearch) {
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
        if (this.currentAction === CurrentAction.ProductSearch || this.currentAction === CurrentAction.ProductBarcodeSearch) {
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
              if ( this.currentAction === CurrentAction.ProductBarcodeSearch ) {
                productResults = productResults.filter( product => isEmpty(product.rawObject.barcodes) === false );
              }

              return productResults;
            })
          );

          this.evaSearchResultLoading$ = searchProducts.isFetching$();

          store.dispatch(action);
        }
        if (this.currentAction === CurrentAction.OrderSearch) {
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
      });

    // We dont want to debounce or check for null values here as we are not doing any new services calls
    //
    mainSearchValueChanges$.subscribe( query => {
      if (this.currentAction === CurrentAction.OrganizationsSearch) {
        this.evaSearchResults$ = getOrganizationUnitsForUser.getResponse$().pipe(
          isNotNil(),
          map(res => res.Result),
          map(page => {
            const organizations: IEvaSearchResult[] = page.map(organization => {
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
      if (this.currentAction === CurrentAction.EndPointUrlSearch) {
        const evaSearchResults = this.$endPointUrlService.endPointUrls.map(endPointUrl => ({
          id: endPointUrl,
          title: endPointUrl,
          rawObject: null
        } as IEvaSearchResult));

        const fusejsSortedOrganizations = this.fusejsPipe.transform(evaSearchResults, query, this.searchOptions);

        this.evaSearchResults$ = of(fusejsSortedOrganizations);
      }
    });
  }

  @HostListener('window:keydown.meta.p', ['$event'])
  @HostListener('window:keydown.control.p', ['$event'])
  openCommandPalette(e: KeyboardEvent) {
    e.preventDefault();

    this.show = true;

    this.zone.onStable.pipe(first()).subscribe(() => {
      this.mainSearchInput.nativeElement.focus();
    });
  }

  @HostListener('window:keydown.ArrowUp', ['$event']) onArrowUp(e: KeyboardEvent) {
    e.preventDefault();

    const resultElements = this.resultsContainer.nativeElement.querySelectorAll('a');

    if ( this.activeSearchIndex === 0 || this.activeSearchIndex === null ) {
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

    if ( resultElements.length - 1 === this.activeSearchIndex || this.activeSearchIndex === null ) {
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

    if ( this.currentAction === CurrentAction.EndPointUrlUpdate ) {
      const newEndPointUrl = prompt('New end point url');

      if ( newEndPointUrl ) {
        this.$endPointUrlService.onChange(newEndPointUrl);
      }
    }
    if ( this.currentAction === CurrentAction.EndPointUrlSearch ) {
      this.evaSearchResults$ = of(this.$endPointUrlService.endPointUrls.map(endPointUrl => ({
        id: endPointUrl,
        title: endPointUrl,
        rawObject: null
      } as IEvaSearchResult)));
    }

    if ( this.currentAction === CurrentAction.UserTokenSwitch ) {
      const newUserToken = prompt('New user token');

      if ( newUserToken ) {
        settings.userToken = newUserToken;
      }
    }
  }

  onResultItemClick(e: KeyboardEvent | MouseEvent, value: IEvaSearchResult) {
    e.preventDefault();

    switch (this.currentAction) {
      case CurrentAction.ProductSearch:
      case CurrentAction.OrderSearch:
      case CurrentAction.UserSearch:
        this.copyEvaSearchResult(value);
      break;
      case CurrentAction.ProductBarcodeSearch:
        this.copyProductBarcode(value);
      break;
      case CurrentAction.OrganizationsSearch:
        this.organizationSelectorComponent.switchOrganization(value.id as number);
      break;
      case CurrentAction.EndPointUrlSearch:
        this.$endPointUrlService.onChange(value.id as string);
      break;

      default:
        console.log('none supported value', this.currentAction);
    }

    this.show = false;
   }

  /** Copies an eva search result item to the clipboard */
  copyEvaSearchResult(value: IEvaSearchResult) {

    this.$clipboardService.copyToClipboard(value.id.toString());

    this.matSnackBar.open(`ID copied to clipboard`, null, { duration: 3000 });

    this.show = false;
  }

  async copyProductBarcode(value: IEvaSearchResult) {

    const barcodes = value.rawObject.barcodes;

    if ( barcodes ) {
      this.$clipboardService.copyToClipboard(barcodes[0]);
    }
  }

}
