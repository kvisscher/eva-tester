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
import { EasterEggComponent, EasterEggDialogComponent } from './components/easter-egg/easter-egg.component';
import { MonacoEditorModule } from './components/editor';
import { HeaderComponent } from './components/header/header.component';
import { MarkdownHtmlComponent } from './components/markdown-html/markdown-html.component';
import { OrganizationSelectorComponent } from './components/organization-selector/organization-selector.component';
import { ServiceTesterComponent } from './components/service-tester/service-tester.component';
import { TesterComponent } from './components/tester/tester.component';
import { ServicesSelectorComponent } from './pages/services-selector/services-selector.component';
import { TesterTabsComponent } from './pages/tester-tabs/tester-tabs.component';
import { ApplicationsService } from './services/applications.service';
import { EvaTypingsService } from './services/eva-typings.service';
import { ListServicesService } from './services/list-services.service';
import { ServiceSelectorService } from './services/service-selector.service';
import { tokenInterceptor } from './services/token-interceptor';
import { JsonFormatterComponent } from './components/json-formatter/json-formatter.component';
import { CultureSelectorComponent } from './components/culture-selector/culture-selector.component';
import { EndPointUrlService } from './services/end-point-url.service';


@NgModule({
  declarations: [
    AppComponent,
    TesterComponent,
    HeaderComponent,
    ServicesSelectorComponent,
    TesterTabsComponent,
    CommandPaletteComponent,
    ServiceTesterComponent,
    MarkdownHtmlComponent,
    EasterEggComponent,
    EasterEggDialogComponent,
    OrganizationSelectorComponent,
    JsonFormatterComponent,
    CultureSelectorComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      { path: '', component: TesterTabsComponent },
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
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    FusejsModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule
  ],
  entryComponents: [EasterEggDialogComponent],
  providers: [
    tokenInterceptor,
    EvaTypingsService,
    ListServicesService,
    ApplicationsService,
    ServiceSelectorService,
    EndPointUrlService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
