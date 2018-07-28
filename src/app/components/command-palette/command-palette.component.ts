import { Component, OnInit, HostListener, ViewChild, NgZone } from '@angular/core';
import { Logger, ILoggable } from '../../decorators/logger';
import { FormBuilder } from '@angular/forms';
import { fadeInOut } from '../../shared/animations';
import { first } from 'rxjs/operators';

@Logger
@Component({
  selector: 'eva-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
  animations: [ fadeInOut ]
})
export class CommandPaletteComponent implements OnInit, ILoggable {
  @ViewChild('input') input: { nativeElement: HTMLInputElement };

  logger: Partial<Console>;

  show = false;

  public tags = ['organization unit', 'users', 'products', 'orders'];

  public autocomplete: string;

  public form = this.fb.group({
    search: []
  });

  constructor(private fb: FormBuilder, private zone: NgZone) {
    this.form.get('search').valueChanges
      .subscribe(value => {
        if (Boolean(value)) {
          const matchingTags = this.tags.filter(tag => {
            const matchingTag = tag.includes(value);
            return matchingTag;
          });
          this.autocomplete = matchingTags[0];
        } else {
          this.autocomplete = null;
        }
      });
  }

  ngOnInit() {
  }

  @HostListener('window:keyup.shift.p', ['$event']) shiftP(e: KeyboardEvent) {
    e.preventDefault();

    console.log('open spotlight');

    this.show = true;

    this.zone.onStable.pipe(first()).subscribe(() => {
      this.input.nativeElement.focus();
    });
  }

  @HostListener('window:keyup.Escape', ['$event']) esc(e: KeyboardEvent) {
    e.preventDefault();

    console.log('close spotlight');

    this.show = false;
  }

  tabPressed(e: KeyboardEvent) {
    e.preventDefault();
    console.log('pressed');
  }

}
