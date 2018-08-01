import { Component, OnInit, Input } from '@angular/core';
import isRequired from '../../decorators/is-required';

@Component({
  selector: 'eva-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent implements OnInit {

  @isRequired
  @Input() icon: string;

  @isRequired
  @Input() title: string;

  constructor() { }

  ngOnInit() {
  }

}
