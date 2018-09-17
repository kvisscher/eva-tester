import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { getCurrentUser } from '@springtree/eva-sdk-redux';
import { withLatestFrom, map, filter, debounceTime } from 'rxjs/operators';
import { IListServiceItem, ListServicesService } from '../../services/list-services.service';
import { ContextMenuController } from '../../components/context-menu';
import { FormBuilder } from '@angular/forms';
import { ServiceSelectorService } from '../../services/service-selector.service';
import { AngularFusejsOptions } from 'angular-fusejs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export interface IServiceChangePayload {
  newTab: boolean;
  service: IListServiceItem;
}

@Component({
  selector: 'eva-tester-container',
  templateUrl: './tester-container.component.html',
  styleUrls: ['./tester-container.component.scss']
})
export class TesterContainerComponent implements OnInit {


  public readonly services$ = this.$listServices.services$;

  public searchOptions: AngularFusejsOptions = {
    keys: ['name', 'ns'],
    maximumScore: 0.5,
    shouldSort: true
  };

  public searchForm = this.formBuilder.group({
    search: [null]
  });

  searchTerms: string;

  public noUser$: Observable<boolean> = getCurrentUser.getState$().pipe(
    filter(state => !state.isFetching),
    withLatestFrom(getCurrentUser.getLoggedInUser$()),
    map(([_currentUser, currentLoggedInUser]) => !Boolean(currentLoggedInUser))
  );


  public selectedService$: BehaviorSubject<IServiceChangePayload> = new BehaviorSubject(null);

  constructor(
    private contextMenuCtrl: ContextMenuController,
    private $listServices: ListServicesService,
    private formBuilder: FormBuilder,
    private $serviceSelector: ServiceSelectorService
  ) {
    this.searchForm.get('search').valueChanges.pipe(debounceTime(500)).subscribe((value: string) => {
      this.searchTerms = value;
    });
  }

  ngOnInit() {
  }

  /** Whenever a service is selected, we will fetch it and create a code template */
  selectService(service: IListServiceItem, mouseEvent: MouseEvent) {
    const newTab = mouseEvent.ctrlKey || mouseEvent.metaKey;

    const serviceChangePayload: IServiceChangePayload = {
      newTab: newTab,
      service: {
        name: service.name,
        ns: service.ns,
        type: service.type
      }
    };

    console.log('select', serviceChangePayload);

    this.selectedService$.next(serviceChangePayload);
  }

  openContextMenu(event: MouseEvent) {
    event.stopPropagation();

    this.contextMenuCtrl.present({
      event: event,
      menu: [{
        title: 'Copy',
        handler: () => { }
      }, {
        title: 'Delete',
        handler: () => { }
      }]
    });
  }

}
