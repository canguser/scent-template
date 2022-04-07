import { createComponent } from '../../../dist/scent.template.esm.js';
import { computed } from 'https://cdn.jsdelivr.net/npm/@vue/reactivity@3.2.31/dist/reactivity.esm-browser.js';
export const wordCard = createComponent({
    name: 'word-card',
    template: `
    <div :class="cardClass">
      <div class="word-card__pinyin slds-grid">
        <div :class="initialClass">
            {$props.initial}
        </div>
        <div :class="finalClass">
            <div s-for:final="finals" class="final-box slds-is-relative">
                <span>{final}</span>
                <span s-if="$index===$props.tonepositions" :class="numClass">
                <template s-if="$props.num == 1">
                    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-mis" absolute="" w="86%" left="8%" style="bottom: 0.78rem;"><path d="M3.35 8C2.60442 8 2 8.60442 2 9.35V10.35C2 11.0956 2.60442 11.7 3.35 11.7H17.35C18.0956 11.7 18.7 11.0956 18.7 10.35V9.35C18.7 8.60442 18.0956 8 17.35 8H3.35Z" fill="currentColor" style=""></path><!----><!----><!----></svg>
                </template>
                <template s-if="$props.num == 2">
                    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="op35" absolute="" w="86%" left="8%" style="bottom: 0.78rem;"><!----><path d="M16.581 3.71105C16.2453 3.27254 15.6176 3.18923 15.1791 3.52498L3.26924 12.6439C2.83073 12.9796 2.74743 13.6073 3.08318 14.0458L4.29903 15.6338C4.63478 16.0723 5.26244 16.1556 5.70095 15.8199L17.6108 6.70095C18.0493 6.3652 18.1327 5.73754 17.7969 5.29903L16.581 3.71105Z" fill="currentColor"></path><!----><!----></svg>
                </template>
                <template s-if="$props.num == 3">
                    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-mis" absolute="" w="86%" left="8%" style="bottom: 0.78rem;">
                        <path d="M1.70711 7.70712C1.31658 7.3166 1.31658 6.68343 1.70711 6.29291L2.41421 5.5858C2.80474 5.19528 3.4379 5.19528 3.82843 5.5858L9.31502 11.0724C9.70555 11.4629 10.3387 11.4629 10.7292 11.0724L16.2158 5.5858C16.6064 5.19528 17.2395 5.19528 17.63 5.5858L18.3372 6.29291C18.7277 6.68343 18.7277 7.3166 18.3372 7.70712L10.7292 15.315C10.3387 15.7056 9.70555 15.7056 9.31502 15.315L1.70711 7.70712Z" fill="currentColor"></path>
                    </svg>
                </template>
                <template s-if="$props.num == 4">
                    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-mis" absolute="" w="86%" left="8%" style="bottom: 0.78rem;"><!----><!----><!----><path d="M4.12282 3.71105C4.45857 3.27254 5.08623 3.18923 5.52474 3.52498L17.4346 12.6439C17.8731 12.9796 17.9564 13.6073 17.6207 14.0458L16.4048 15.6338C16.0691 16.0723 15.4414 16.1556 15.0029 15.8199L3.09303 6.70095C2.65452 6.3652 2.57122 5.73754 2.90697 5.29903L4.12282 3.71105Z" fill="currentColor"></path></svg>
                </template>
                </span>
            </div>
        </div>
      </div>
      <div class="word-card__word">{$props.word}</div>
    </div>
  `,
    data(props = {}) {
        const checkResult = computed(() => props.checkresult || {});
        const finals = computed(() =>
            [...(props.final || [])].map((f, index) => {
                if (index === props.tonepositions && f === 'i') {
                    return 'ı';
                }
                return f;
            })
        );
        const allEquals = computed(() => checkResult.value.word === 'equals');
        const allIn = computed(() => checkResult.value.word === 'in');
        const initialStatus = computed(() => checkResult.value.initial);
        const finalStatus = computed(() => checkResult.value.final);
        const numStatus = computed(() => checkResult.value.num);
        return {
            finals,
            cardClass: computed(() => ['word-card', allEquals.value ? 'equals' : allIn.value ? 'in' : ''].join(' ')),
            initialClass: computed(() => ['word-card__pinyin_initials', initialStatus.value].join(' ')),
            finalClass: computed(() => ['word-card__pinyin_vowels', 'slds-grid', finalStatus.value].join(' ')),
            numClass: computed(() => ['word-card__tone', numStatus.value].join(' '))
        };
    }
});