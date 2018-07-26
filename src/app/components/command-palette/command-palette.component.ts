import { Component, OnInit, HostListener } from '@angular/core';
import { Logger, ILoggable } from '../../decorators/logger';

@Logger
@Component({
  selector: 'eva-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss']
})
export class CommandPaletteComponent implements OnInit, ILoggable {
  public logger: Partial<Console>;

  constructor() { }

  ngOnInit() {
  }

  @HostListener('window:keyup.shift.p', ['$event']) shiftP(e: KeyboardEvent) {
    e.preventDefault();

    this.logger.log('open spotlight');
  }

  @HostListener('window:keyup.Escape', ['$event']) esc(e: KeyboardEvent) {
    e.preventDefault();

    this.logger.log('close spotlight');
  }

}
