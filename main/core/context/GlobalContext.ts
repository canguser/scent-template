import { ScentObject } from '../../utils/ScentObject';

export class GlobalContext extends ScentObject {
    [key: string | symbol]: any;
    constructor(context: object = {}) {
        super();
        Object.assign(this, context);
    }
}
