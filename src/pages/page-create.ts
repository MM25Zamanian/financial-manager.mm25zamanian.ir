import {router} from '@alwatr/router';
import {LocalizeController} from '@shoelace-style/localize/dist/index.js';
import {css, html} from 'lit';
import {customElement} from 'lit/decorators/custom-element.js';
import {state} from 'lit/decorators/state.js';
import {when} from 'lit/directives/when.js';

import {AppElement} from '../app-debt/app-element';
import {financialOperationTypes, financialCategories} from '../config';
import {dbPromise} from '../utilities/database';
import {_renderToast} from '../utilities/toast';

import type {ListenerInterface} from '@alwatr/signal';
import type {SelectCustomEvent, InputCustomEvent} from '@ionic/core';
import type {TemplateResult, CSSResult} from 'lit';

declare global {
  interface HTMLElementTagNameMap {
    'page-create': PageCreate;
  }
}

@customElement('page-create')
export class PageCreate extends AppElement {
  static override styles = [
    ...(<CSSResult[]>AppElement.styles),
    css`
      :host {
        display: flex;
        flex-direction: column;
      }

      ion-header ion-select {
        --padding-end: 16px;
      }
      ion-button {
        margin: 12px 16px;
      }

      .output-financial-operation-chip {
        display: flex;
        justify-content: center;
      }
    `,
  ];

  protected _listenerList: Array<unknown> = [];
  protected _localize = new LocalizeController(this);

  @state() protected _financialOperationType: 'expenses' | 'income' = financialOperationTypes[0];
  @state() protected _financialOperationCategory = '';
  @state() protected _financialOperationDescription = '';
  @state() protected _financialOperationValue = 0;

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
      <ion-header> ${this._renderHeader()} </ion-header>
      <ion-content> ${this._renderFinancialOperationForm()} </ion-content>
    `;
  }

  protected _renderHeader(): TemplateResult {
    return html`
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button href=${router.makeUrl({sectionList: ['home']})}>
            <er-iconsax slot="icon-only" name="arrow-left-1" category="broken"></er-iconsax>
          </ion-button>
        </ion-buttons>

        ${this._renderFinancialTypeSelect()}
      </ion-toolbar>
    `;
  }
  protected _renderFinancialTypeSelect(): TemplateResult {
    const listTemplate = financialOperationTypes.map(
        (type) => html`<ion-select-option value=${type}>${this._localize.term(type)}</ion-select-option>`,
    );

    return html`
      <ion-select
        interface="alert"
        value=${financialOperationTypes[0]}
        ok-text=${this._localize.term('ok')}
        cancel-text=${this._localize.term('cancel')}
        @ionChange=${this._financialOperationTypeChanged}
      >
        ${listTemplate}
      </ion-select>
    `;
  }
  protected _renderFinancialCategoriesSelect(): TemplateResult {
    const listTemplate = financialCategories
        .filter((category) => category.type === this._financialOperationType)
        .map(
            (category) => html`
          <ion-select-option value=${category.name}> ${this._localize.term(category.name)} </ion-select-option>
        `,
        );

    return html`
      <ion-select
        interface="alert"
        value=${financialOperationTypes[0]}
        ok-text=${this._localize.term('ok')}
        cancel-text=${this._localize.term('cancel')}
        @ionChange=${this._financialOperationCategoryChanged}
      >
        ${listTemplate}
      </ion-select>
    `;
  }
  protected _renderFinancialOperationForm(): TemplateResult {
    return html`
      <ion-list>
        <ion-item>
          <ion-label>${this._localize.term('operation_category')}</ion-label>
          ${this._renderFinancialCategoriesSelect()}
        </ion-item>
        <ion-item>
          <ion-label position="floating">${this._localize.term('operation_description')}</ion-label>
          <ion-input
            type="text"
            input-mode="text"
            placeholder=${this._localize.term('enter_a_description_of_this_operation')}
            @ionChange=${this._financialOperationDescriptionChanged}
            clear-input
            required
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">${this._localize.term('operation_value')}</ion-label>
          <ion-input
            type="number"
            input-mode="numeric"
            placeholder=${this._localize.term('enter_the_value_of_this_operation')}
            @ionChange=${this._financialOperationValueChanged}
            clear-input
            required
          ></ion-input>
        </ion-item>
      </ion-list>
      <ion-button expand="block" @click=${this._recordOperation} ?disabled=${!this._canRecordOperation}>
        ${this._localize.term('record_operations')}
        ${when(
      this._financialOperationValue,
      () =>
        ` - ${this._financialOperationValue.toLocaleString(this._localize.lang())} ${this._localize.term('$money')}`,
  )}
      </ion-button>
    `;
  }

  protected _financialOperationTypeChanged(event: SelectCustomEvent): void {
    this._financialOperationType = event.detail.value;
  }
  protected _financialOperationCategoryChanged(event: SelectCustomEvent): void {
    this._financialOperationCategory = event.detail.value;
  }
  protected _financialOperationDescriptionChanged(event: InputCustomEvent): void {
    this._financialOperationDescription = event.detail.value ?? '';
  }
  protected _financialOperationValueChanged(event: InputCustomEvent): void {
    this._financialOperationValue = Number(event.detail.value ?? 0);
  }

  protected async _recordOperation(): Promise<void> {
    const _financialOperationCategory = financialCategories.find(
        (financialCategory) => financialCategory.name === this._financialOperationCategory,
    );

    if (
      !this._financialOperationDescription ||
      !this._financialOperationCategory ||
      !this._financialOperationValue ||
      !_financialOperationCategory
    ) {
      return;
    }

    const loading = document.createElement('ion-loading');

    loading.message = this._localize.term('registering_operations');

    document.body.appendChild(loading);
    await loading.present();

    const db = await dbPromise;

    await db
        .put('financial-operation', {
          value: this._financialOperationValue,
          type: this._financialOperationType,
          description: this._financialOperationDescription,
          category: _financialOperationCategory,
          datetime: new Date(),
        })
        .then(() => _renderToast(this._localize.term('the_operation_was_successful')))
        .catch((error) => _renderToast(error));

    await loading.dismiss();

    router.signal.request({pathname: '/'});
  }

  protected get _canRecordOperation(): boolean {
    return !(
      !this._financialOperationCategory ||
      !this._financialOperationDescription ||
      !this._financialOperationType ||
      !this._financialOperationValue
    );
  }
}
