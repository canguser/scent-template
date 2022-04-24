import { getProperty } from '@rapidly/utils/lib/object/getProperty';
import { merge } from '../utils/NormalUtils';
import { ScentObject } from '../utils/ScentObject';

export class Configuration extends ScentObject{
    configs: {
        [key: string]: any;
    } = {};

    public override(configs): Configuration {
        merge(this.configs, configs);
        return this;
    }

    public getConfigurationOf(key: string): Configuration {
        const result = new Configuration();
        const config = getProperty(this.configs, key, {});
        result.override(config);
        return result;
    }

    public get<T = any>(key?: string, defaultValue?: T): T {
        let value;
        if (key == null) {
            value = this.configs;
        } else {
            value = getProperty(this.configs, key) as T;
        }
        if (value == null) {
            value = defaultValue;
        }
        return value;
    }
}
