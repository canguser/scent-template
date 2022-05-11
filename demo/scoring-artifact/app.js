import { Reactivity, Scent } from './lib.js';
const { defineComponent } = Scent;
import { router } from './router.js';

export const app = defineComponent({
    components: { router },
    template: `
        <div>
            <p>记分神器</p>
            <div>
                <router/>
            </div>
        </div>
    `
});
