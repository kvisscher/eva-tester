import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { getCurrentUser } from '@springtree/eva-sdk-redux';
import { withLatestFrom, map, filter } from 'rxjs/operators';
import { IListServiceItem } from '../../services/list-services.service';

@Component({
  selector: 'eva-tester-tabs',
  templateUrl: './tester-tabs.component.html',
  styleUrls: ['./tester-tabs.component.scss']
})
export class TesterTabsComponent implements OnInit {

  public noUser$: Observable<boolean> = getCurrentUser.getState$().pipe(
    filter(state => !state.isFetching),
    withLatestFrom(getCurrentUser.getLoggedInUser$()),
    map(([_currentUser, currentLoggedInUser]) => !Boolean(currentLoggedInUser))
  );

  public tabs: Partial<IListServiceItem>[] = [{
    name: 'Service 1'
  }];

  public selectedTabIndex = 0;

  constructor() { }

  ngOnInit() {
  }

  public addTab() {
    this.tabs.push({
      name: `Service ${this.tabs.length + 1}`
    });

    this.selectedTabIndex = this.tabs.length;
  }

  selectedServiceChange(serviceName: IListServiceItem, index: number) {
    this.tabs[index].name = serviceName.name;
  }

}
