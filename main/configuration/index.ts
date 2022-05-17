import { Configuration } from '@scent/core/typing/configure/Configuration';

let configuration: Configuration;

export function getConfiguration(): Configuration {
    if (!configuration) {
        console.warn('Using method `Scent.use()` to add scentPlugin from the template first.');
    }
    return configuration;
}

export function useConfiguration(config: Configuration): void {
    configuration = config;
}
