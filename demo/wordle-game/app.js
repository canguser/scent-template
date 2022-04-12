import { Reactivity, Pinyin, Scent } from './lib.js';
import { wordCard } from './components/word-card.js';
import DICT4 from './data/dict4.js';
const { createComponent } = Scent;
const { reactive, computed, ref } = Reactivity;
const { pinyin } = Pinyin;
function getWordsInfo(words) {
    words = (words || '').trim().slice(0, 4);
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
            <div class="slds-p-top--small">
                <div s-if="message">
                    {message}
                </div>
                <div class="guess-fixed" s-if="!message && words != null" @keydown="e=>{if (e.keyCode === 13) addWords(e)}">
                    <input :style="showGuessInput?'display:block':'display:none'" class="guess-item" @blur="addWords" type="text" s-model="words">
                    <div :style="showGuessInput?'display:none':'display:block'" @click="inputGuessWord" class="slds-text-align--center">
                        <button class="slds-button slds-button_neutral guess-item" type="submit">猜一下</button>
                    </div>
                </div>
            </div>
            <div class="cards-box slds-m-bottom_large" @click="inputGuessWord">
                <div s-for:line="displayedLines" class="cards-line slds-grid">
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
            </div>
        </div>
        <div class="footer"></div>
    `,
    data(props, instance) {
        const histories = reactive([]);
        const words = ref('');
        const message = ref('');
        const startTime = ref(Date.now());
        const showGuessInput = ref(false);
        const guessWords = computed(() => {
            if (words.value === null) {
                return [];
            }
            const infos = getWordsInfo(words.value);
            return [0, 1, 2, 3].map((i) => {
                const info = infos[i];
                return {
                    ...info
                };
            });
        });
        const displayedLines = (window.d = computed(() => {
            if (guessWords.value.length === 0) {
                return [...histories];
            }
            return [...histories, guessWords.value];
        }));
        function inputGuessWord() {
            showGuessInput.value = true;
            const input = instance.target.querySelector('input.guess-item');
            if (input) {
                setTimeout(() => {
                    input.focus();
                }, 100);
            }
        }
        return {
            startTime,
            displayedLines,
            words,
            message,
            guessWords,
            showGuessInput,
            addWords(e) {
                e.stopPropagation();
                e.preventDefault();
                showGuessInput.value = false;
                const newWords = (words.value || '').trim();
                if (newWords.length < 4) {
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
                const outerBox = instance.target.querySelector('.outer-box');
                setTimeout(() => {
                    outerBox.scroll(0, outerBox.offsetHeight);
                }, 100);
            },
            inputGuessWord
        };
    }
}));
