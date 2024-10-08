import { Scent } from '../lib.js';
const { defineComponent } = Scent;

export const basicModal = defineComponent({
    name: 'basic-modal',
    template: `
    <section role="dialog" tabindex="-1" aria-labelledby="modal-heading-01" aria-modal="true" class="slds-modal slds-modal_small" :class="{'slds-fade-in-open': $props.isOpen}">
      <div class="slds-modal__container">
        <div class="slds-modal__header">
          <h1 id="modal-heading-01" class="slds-modal__title slds-text-heading--medium slds-hyphenate">
            <slot name="header">头部内容</slot>
          </h1>
        </div>
        <div class="slds-modal__content slds-p-around_medium" id="modal-content-id-1">
          <slot>内容</slot>
        </div>
        <div class="slds-modal__footer">
          <slot name="footer">
            <button class="slds-button slds-button_neutral" aria-label="Cancel and close">Cancel</button>
            <button class="slds-button slds-button_brand">Save</button>
          </slot>
        </div>
      </div>
    </section>
    <div class="slds-backdrop" role="presentation" :class="{'slds-backdrop_open': $props.isOpen}"></div>
    `
});
