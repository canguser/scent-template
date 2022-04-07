import { createComponent } from '../../dist/scent.template.esm.js';
import { wordCard } from './components/word-card.js';
import DICT4 from './data/dict4.js';
import { pinyin } from 'https://cdn.jsdelivr.net/gh/zh-lx/pinyin-pro@3.8.3/dist/index.esm.js';
import {
    reactive,
    computed,
    ref
} from 'https://cdn.jsdelivr.net/npm/@vue/reactivity@3.2.31/dist/reactivity.esm-browser.js';
function getWordsInfo(words) {
    words = words.trim().slice(0, 4);
    if (words.length !== 4) {
        return [];
    }
    const initials = pinyin(words, { type: 'array', pattern: 'initial' });
    const finals = pinyin(words, { type: 'array', pattern: 'final', toneType: 'none' });
    const finals_tone = pinyin(words, { type: 'array', pattern: 'final' });
    const nums = pinyin(words, { type: 'array', pattern: 'num' });
    return [...words].map((word, i) => {
        let tonePositions = 0;
        const finalsArray = [...finals_tone[i]];
        for (let j = 0; j < finalsArray.length; j++) {
            const char = finalsArray[j];
            if (!/[a-z]/i.test(char)) {
                tonePositions = j;
                break;
            }
        }
        return {
            word,
            initial: initials[i],
            final: finals[i],
            num: nums[i],
            tonePositions,
            index: i
        };
    });
}
const toCheckWords = (window.toCheckWords = DICT4[Math.floor(Math.random() * DICT4.length)]);

function checkInOrEquals(word, index, words, noIndex) {
    if (word === words[index]) {
        return 'equals';
    }
    const i = words.indexOf(word);
    if (i > -1 && i !== index) {
        if (noIndex) {
            return 'in';
        }
        return 'in ' + i;
    }
    return 'not';
}

function reorderDiff(words, prefix = 'in') {
    const toCheckWords = words.splice(0);
    let count = 0;
    for (let i = 0; i < toCheckWords.length; i++) {
        if (!words[i] && toCheckWords[i]) {
            const word = toCheckWords[i];
            words[i] = prefix;
            if (count > 0) {
                words[i] += ' n' + count;
            }
            // find all words in words list equal to word
            for (let j = i + 1; j < toCheckWords.length; j++) {
                const targetWord = toCheckWords[j];
                if (targetWord === word) {
                    words[j] = prefix;
                    if (count > 0) {
                        words[j] += ' n' + count;
                    }
                }
            }
            count++;
        }
    }
}

function checkWords(words) {
    const wordsInfo = getWordsInfo(words);
    const checkedWordsInfo = getWordsInfo(toCheckWords);
    return wordsInfo.map((w) => {
        let word = checkInOrEquals(
            w.word,
            w.index,
            checkedWordsInfo.map((w) => w.word),
            true
        );
        let _initial = checkInOrEquals(
            w.initial,
            w.index,
            checkedWordsInfo.map((w) => w.initial)
        );
        let _final = checkInOrEquals(
            w.final,
            w.index,
            checkedWordsInfo.map((w) => w.final)
        );
        let _num = checkInOrEquals(
            w.num,
            w.index,
            checkedWordsInfo.map((w) => w.num)
        );
        const assigner = [_initial, _final, _num].map((w) => {
            if (w.startsWith('in')) {
                return w;
            }
            return null;
        });
        reorderDiff(assigner);
        const [initial = _initial, final = _final, num = _num] = assigner;
        return {
            ...w,
            checkResult: {
                initial,
                final,
                num,
                word
            }
        };
    });
}

export const app = (window.p = createComponent({
    components: { wordCard },
    template: `
        <div class="nav-bar">
            <h2 class="slds-text-heading--medium">猜成语</h2>
        </div>
        <div class="outer-box">
            <div class="cards-box slds-m-bottom_large">
                <div s-if="histories.length===0" class="slds-grid slds-gutters">
                    <div s-for="[1,2,3,4]">
                        <div class="word-card slds-box_border"></div>
                    </div>
                </div>
                <div s-for:line="histories" class="cards-line slds-grid">
                    <div s-for:item="line">
                        <word-card 
                        :word="item.word" 
                        :initial="item.initial"
                        :final="item.final"
                        :num="item.num"
                        :tonePositions="item.tonePositions"
                        :checkResult="item.checkResult"
                        ></word-card>
                    </div>
                </div>
                <div class="slds-p-top--small">
                    <div s-if="message">
                        {message}
                    </div>
                    <div class="" s-if="!message">
                        <form @submit="addWords">
                            <input class="guess-input slds-box_border" type="text" s-model="words" placeholder="输入一个四字成语">
                            <div class="slds-text-align--center slds-p-top--small">
                                <button class="slds-button slds-button_neutral" type="submit">猜一下</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        const histories = reactive([]);
        const words = ref('');
        const message= ref('');
        const startTime = ref(Date.now());
        return {
            startTime,
            histories,
            words,
            message,
            addWords(e) {
                e.stopPropagation();
                e.preventDefault();
                const newWords = words.value.trim();
                if (newWords.length !== 4) {
                    return;
                }
                const results = checkWords(newWords);
                histories.push(results);
                words.value = '';
                if (results.every((w) => w.checkResult.word === 'equals')) {
                    const usingTime = Date.now() - startTime.value;
                    // get minutes an seconds
                    const minutes = Math.floor(usingTime / 1000 / 60);
                    const seconds = Math.floor(usingTime / 1000) % 60;
                    message.value = `恭喜你，猜对了，用时${minutes}分${seconds}秒`;
                }
            }
        };
    }
}));
