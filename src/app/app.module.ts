import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FusejsModule } from 'angular-fusejs';
import { AppComponent } from './app.component';
import { CommandPaletteComponent } from './components/command-palette/command-palette.component';
import { EvaContextMenuModule } from './components/context-menu/context-menu.module';
import { CultureSelectorComponent } from './components/culture-selector/culture-selector.component';
import { DragComponent } from './components/drag/drag.component';
import { EasterEggComponent, EasterEggDialogComponent } from './components/easter-egg/easter-egg.component';
import { MonacoEditorModule } from './components/editor';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { HeaderComponent } from './components/header/header.component';
import { JsonFormatterComponent } from './components/json-formatter/json-formatter.component';
import { MarkdownHtmlComponent } from './components/markdown-html/markdown-html.component';
import { OrganizationSelectorComponent } from './components/organization-selector/organization-selector.component';
import { ServiceTesterInfoComponent } from './components/service-tester-info/service-tester-info.component';
import { ServiceTesterComponent } from './components/service-tester/service-tester.component';
import { TesterComponent } from './components/tester/tester.component';
import { ServicesSelectorComponent } from './pages/services-selector/services-selector.component';
import { TesterContainerComponent } from './pages/tester-container/tester-container.component';
import { ApplicationsService } from './services/applications.service';
import { ClipboardService } from './services/clipboard.service';
import { EndPointUrlService } from './services/end-point-url.service';
import { EvaTypingsService } from './services/eva-typings.service';
import { ListServicesService } from './services/list-services.service';
import { ServiceSelectorService } from './services/service-selector.service';
import { StoreInitService } from './services/store-init.service';
import { tokenInterceptor } from './services/token-interceptor';


@NgModule({
  declarations: [
    AppComponent,
    TesterComponent,
    HeaderComponent,
    ServicesSelectorComponent,
    CommandPaletteComponent,
    ServiceTesterComponent,
    MarkdownHtmlComponent,
    EasterEggComponent,
    EasterEggDialogComponent,
    OrganizationSelectorComponent,
    JsonFormatterComponent,
    CultureSelectorComponent,
    EmptyStateComponent,
    DragComponent,
    ServiceTesterInfoComponent,
    TesterContainerComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      { path: '', component: TesterContainerComponent },
      { path: 'service/:serviceName', component: ServiceTesterComponent },
      { path: 'selector/:portNumber', component: ServicesSelectorComponent }
    ]),
    MonacoEditorModule.forRoot(),
    HttpClientModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatMenuModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    FusejsModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    EvaContextMenuModule
  ],
  entryComponents: [EasterEggDialogComponent],
  providers: [
    tokenInterceptor,
    EvaTypingsService,
    ListServicesService,
    ApplicationsService,
    ServiceSelectorService,
    EndPointUrlService,
    StoreInitService,
    ClipboardService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
