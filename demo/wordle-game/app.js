import { Reactivity, Pinyin, Scent } from './lib.js';
import { wordCard } from './components/word-card.js';
import { basicModal } from './components/basic-modal.js';
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
    components: { wordCard, basicModal },
    template: `
        <div class="nav-bar">
            <h2 class="header slds-text-heading--medium">猜成语 <span class="tips" @click="showTips=true">?</span></h2>
        </div>
        <div class="outer-box">
            <div class="slds-p-top--small">
                <div s-if="message">
                    {message} <a href="javascript:;" @click="reload">再来一次</a>
                </div>
                <div s-if="!message && words != null" @keydown="e=>{if (e.keyCode === 13) addWords(e)}">
                    <input class="guess-item" @blur="addWords" type="text" s-model="words" placeholder="请输入一个四字成语">
                </div>
            </div>
            <div class="cards-box-wrap">
                <div class="cards-box slds-m-bottom_large" @click="inputGuessWord">
                    <div s-for:line="displayedLines" class="cards-line slds-grid">
                        <div s-for:item="line">
                            <word-card 
                            :word="item.word" 
                            :initial="item.initial"
                            :final="item.final"
                            :num="item.num"
                            :tone-positions="item.tonePositions"
                            :check-result="item.checkResult"
                            ></word-card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer"></div>
        <basic-modal ref="tipModal" :is-open="showTips">
            <div slot="header">猜成语（游戏规则）</div>
            <div class="slds-text-align_center modal-tips">
                <p>每次进入该页面时，会随机生成一个成语以供猜测</p>
                <p>你可以输入一个成语来猜测正确答案</p>
                <p>每次猜测都会为你后面的猜测提供线索</p>
                <br>
                <p>每个格子的 汉字、声母、韵母、声调 都会独立进行颜色的指示</p>
                <br>
                <p><span class="equals">绿色：</span>代表该 汉字/声母/韵母/声调 出现在正确成语中正确的位置</p>
                <p><span class="in">橙色：</span>代表该 汉字/声母/韵母/声调 出现再正确成语中不正确的位置</p>
                <p><span class="not">黑色：</span>代表该 汉字/声母/韵母/声调 是不属于正确成语的任何一部分</p>
                <br>
                <p><b>注意：</b></p>
                <p>1. 输入完待猜测的成语后需要点击回车或点击输入框外以触发成语检查。</p>
                <p>2. 刷新页面后会重置成语。</p>
            </div>
            <div slot="footer" class="slds-grid slds-grid--align-center">
                <button class="slds-button slds-button_brand" @click="showTips=false,inputGuessWord()">知道了</button>
            </div>
        </basic-modal>
    `,
    data(props, instance) {
        const isFirst = !localStorage.getItem('guess-word-first-time');
        localStorage.setItem('guess-word-first-time', true);
        const histories = reactive([]);
        const words = ref('');
        const message = ref('');
        const startTime = ref(Date.now());
        const showGuessInput = ref(false);
        const guessRight = computed(() => !!message.value);
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
            if (guessWords.value.length === 0 || guessRight.value) {
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
                    message.value = `恭喜你，猜对了，用时${minutes}分${seconds}秒。`;
                }
            },
            inputGuessWord,
            showTips: ref(isFirst),
            reload(){
                window.location.reload();
            }
        };
    }
}));
