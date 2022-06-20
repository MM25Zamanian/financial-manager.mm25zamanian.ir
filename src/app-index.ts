import {router} from '@alwatr/router';
import {SignalInterface} from '@alwatr/signal';
import {registerTranslation, LocalizeController} from '@shoelace-style/localize/dist/index.js';
import {css, html, nothing} from 'lit';
import {customElement} from 'lit/decorators/custom-element.js';
import {state} from 'lit/decorators/state.js';

import '@erbium/iconsax';
import 'pwa-helper-components/pwa-install-button.js';
import 'pwa-helper-components/pwa-update-available.js';

import {AppElement} from './app-debt/app-element';
import {mainTabBar} from './config';
import en from './translation/en';
import fa from './translation/fa';
import {dbPromise} from './utilities/database';

import './pages/page-home';
import './pages/page-create';
import './pages/page-about';

import type {RoutesConfig} from '@alwatr/router';
import type {ListenerInterface} from '@alwatr/signal';
import type {TemplateResult, CSSResult} from 'lit';

declare global {
  interface HTMLElementTagNameMap {
    'app-index': AppIndex;
  }
}

/**
 * APP PWA Root Element
 *
 * ```html
 * <app-index></app-index>
 * ```
 */
@customElement('app-index')
export class AppIndex extends AppElement {
  static override styles = [
    ...(<CSSResult[]>AppElement.styles),
    css`
      :host {
        inset: 0;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        position: absolute;
        flex-direction: column;
        justify-content: space-between;
        contain: layout size style;
        overflow: hidden;
        z-index: 0;
      }
      .page-container {
        position: relative;
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0%;
        contain: size layout style;
      }
      ion-tab-bar {
        height: 56px;
      }
      ion-tab-button {
        letter-spacing: 0;
        font-size: 12px;
        font-weight: 400;
      }
      /* This will be displayed only on lazy loading. */
      [unresolved]::after {
        content: '...';
        display: block;
        font-size: 2em;
        padding-top: 30vh;
        letter-spacing: 3px;
        text-align: center;
      }
    `,
  ];

  constructor() {
    super();
    router.initial();
  }

  @state() protected _hideTabBar = true;

  protected _routes: RoutesConfig = {
    // TODO: refactor route, we need to get active page!
    // TODO: ability to redirect!
    map: (route) => (this._activePage = route.sectionList[0]?.toString().trim() || 'home'),
    list: {
      home: {
        render: () => html`<page-home class="ion-page"></page-home>`,
      },
      create: {
        render: () => html`<page-create class="ion-page can-go-back"></page-create>`,
      },
      about: {
        render: () => html`<page-about class="ion-page"></page-about>`,
      },
    },
  };

  protected _hideTabBarSignal = new SignalInterface('hide-tab-bar');
  protected _localize = new LocalizeController(this);
  protected _activePage = 'home';
  protected _listenerList: Array<unknown> = [];

  override connectedCallback(): void {
    super.connectedCallback();

    registerTranslation(en, fa);

    this._listenerList.push(
        router.signal.addListener(
            (route) => {
              this._logger.logMethodArgs('routeChanged', {route});
              this._activePage = route.sectionList[0]?.toString().trim() || 'home';
              this.requestUpdate();
            },
            {receivePrevious: true},
        ),
        this._hideTabBarSignal.addListener((_hideNavigation) => {
          this._hideTabBar = _hideNavigation;
        }),
    );

    this._hideTabBarSignal.dispatch(false);

    dbPromise
        .then((db) => {
          this._logger.logProperty('db', db);
        // db.getAllKeys('financial-operation').then((d) => d.forEach((i) => db.delete('financial-operation', i)));
        })
        .catch((error) => {
          this._logger.error('db', '400', error);
        });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._listenerList.forEach((listener) => (listener as ListenerInterface<keyof AlwatrSignals>).remove());
  }

  override render(): TemplateResult {
    return html`
      <main class="page-container">${router.outlet(this._routes)}</main>
      ${this._renderTabBar()}
    `;
  }

  protected _renderTabBar(): TemplateResult | typeof nothing {
    if (this._hideTabBar) return nothing;

    const listTemplate = mainTabBar.map((item) => {
      const selected = this._activePage === item.id;
      return html`
        <ion-tab-button href=${router.makeUrl({sectionList: [item.id]})} ?selected=${selected}>
          <er-iconsax name=${item.icon} category=${selected ? 'bold' : 'broken'}></er-iconsax>
          <ion-label>${this._localize.term(item.title)}</ion-label>
        </ion-tab-button>
      `;
    });

    return html`<ion-tab-bar>${listTemplate}</ion-tab-bar>`;
  }
}
