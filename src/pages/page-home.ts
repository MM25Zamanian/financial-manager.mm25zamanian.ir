import {router} from '@alwatr/router';
import {LocalizeController} from '@shoelace-style/localize/dist/index.js';
import {css, html} from 'lit';
import {customElement} from 'lit/decorators/custom-element.js';
import {query} from 'lit/decorators/query.js';

import {AppElement} from '../app-debt/app-element';
import {dbPromise} from '../utilities/database';
import {_renderToast} from '../utilities/toast';

import type {financialOperation} from '../utilities/database';
import type {ListenerInterface} from '@alwatr/signal';
import type {IonModal} from '@ionic/core/components/ion-modal';
import type {TemplateResult, CSSResult, PropertyValues} from 'lit';

declare global {
  interface HTMLElementTagNameMap {
    'page-home': PageHome;
  }
}

/**
 * APP PWA Home Page Element
 *
 * ```html
 * <page-home></page-home>
 * ```
 */
@customElement('page-home')
export class PageHome extends AppElement {
  static override styles = [
    ...(<CSSResult[]>AppElement.styles),
    css`
      :host {
        display: flex;
        flex-direction: column;
      }
    `,
    css`
      .fo__list .fo__list__item {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .fo__list .fo__list-seprator {
        display: flex;
        margin: 15px 0;
        width: 1px;
        background-color: var(--ion-tab-bar-color);
      }
      .fo__list .fo__list__item .fo__list__item-label {
        margin-bottom: 8px;
      }
    `,
  ];

  @query('ion-modal') protected _modal!: IonModal;

  protected _listenerList: Array<unknown> = [];
  protected _localize = new LocalizeController(this);
  protected _financialOperationList: financialOperation[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    // this._listenerList.push(router.signal.addListener(() => this.requestUpdate()));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._listenerList.forEach((listener) => (listener as ListenerInterface<keyof AlwatrSignals>).remove());
  }

  override render(): TemplateResult {
    return html`
      <ion-header> ${this._renderToolbar()} </ion-header>
      <ion-content>
        ${this._renderFinancialOperationsCard()} ${this._renderFinancialOperationList()}
        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button href=${router.makeUrl({sectionList: ['create']})}>
            <er-iconsax name="add" category="broken"></er-iconsax>
          </ion-fab-button>
        </ion-fab>
      </ion-content>
    `;
  }

  protected _renderToolbar(): TemplateResult {
    const title = this._localize.term('$title');
    const titleTemplate = html`<ion-title>${title}</ion-title>`;

    return html` <ion-toolbar> ${titleTemplate} </ion-toolbar> `;
  }
  protected _renderFinancialOperationsCard(): TemplateResult {
    return html`
      <ion-card>
        <ion-row class="fo__list">
          <ion-col class="fo__list__item">
            <ion-label class="fo__list__item-label">${this._localize.term('income')}</ion-label>
            <span class="fo__list__item-value">${this._income.toLocaleString(this._localize.dir())}</span>
          </ion-col>
          <div class="fo__list-seprator"></div>
          <ion-col class="fo__list__item">
            <ion-label class="fo__list__item-label">${this._localize.term('expenses')}</ion-label>
            <span class="fo__list__item-value">${this._expenses.toLocaleString(this._localize.dir())}</span>
          </ion-col>
          <div class="fo__list-seprator"></div>
          <ion-col class="fo__list__item">
            <ion-label class="fo__list__item-label">${this._localize.term('balance')}</ion-label>
            <span class="fo__list__item-value">${this._balance.toLocaleString(this._localize.dir())}</span>
          </ion-col>
        </ion-row>
      </ion-card>
    `;
  }
  protected _renderFinancialOperationList(): TemplateResult {
    const listTemplate = this._financialOperationList.map((foItem) => {
      return html`
        <ion-item-sliding>
          <ion-item>
            <er-iconsax name=${foItem.category.icon} category="broken" slot="end"></er-iconsax>
            <ion-label>${foItem.description}</ion-label>
          </ion-item>

          <ion-item-options side="start">
            <ion-item-option color="danger" @click=${(): Promise<void> => this._deleteFinancialOpeation(foItem.id)}>
              <er-iconsax name="trash" category="broken" slot="end"></er-iconsax>
              <ion-label slot="start">${this._localize.term('delete')}</ion-label>
            </ion-item-option>
          </ion-item-options>

          <ion-item-options side="end">
            <ion-item-option color="tertiary">
              <er-iconsax name="edit-2" category="broken" slot="start"></er-iconsax>
              <ion-label slot="end">${this._localize.term('edit')}</ion-label>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      `;
    });

    return html` <ion-list> ${listTemplate} </ion-list> `;
  }

  protected async _deleteFinancialOpeation(key?: number): Promise<void> {
    if (key === undefined) return;

    const loading = document.createElement('ion-loading');

    loading.message = this._localize.term('removing');

    document.body.appendChild(loading);
    await loading.present();

    const db = await dbPromise;

    await db
        .delete('financial-operation', key)
        .then(() => _renderToast(this._localize.term('the_operation_was_successful')))
        .catch((error) => _renderToast(error));

    await loading.dismiss();
  }

  protected get _income(): number {
    return this._financialOperationList
        .filter((foItem) => foItem.type === 'income')
        .map((foItem) => foItem.value)
        .reduce((p, c) => p + c, 0);
  }
  protected get _expenses(): number {
    return this._financialOperationList
        .filter((foItem) => foItem.type === 'expenses')
        .map((foItem) => foItem.value)
        .reduce((p, c) => p + c, 0);
  }
  protected get _balance(): number {
    return this._income - this._expenses;
  }

  protected override updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties);

    dbPromise.then(async (db) => {
      this._financialOperationList = await db.getAll('financial-operation');
      this.requestUpdate();
    });

    this.shadowRoot?.querySelectorAll('ion-item-sliding').forEach((itemSliding) => {
      const item = itemSliding.querySelector('ion-item');
      const open = async (): Promise<void> => await itemSliding.open('start');
      const close = async (): Promise<void> => await itemSliding.close();

      if (item) {
        item.removeEventListener('click', open);
        item.addEventListener('click', open);

        document.body.addEventListener('mouseup', close);
      }
    });
  }
}
