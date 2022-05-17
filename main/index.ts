import { Scent, PluginCallback } from '@scent/core';
import { ForStrategy } from './stragtegies/ForStrategy';
import { IfStrategy } from './stragtegies/IfStrategy';
import { AttrStrategy } from './stragtegies/AttrStrategy';
import { EventStrategy } from './stragtegies/EventStrategy';
import { ModelStrategy } from './stragtegies/ModelStrategy';
import { TextStrategy } from './stragtegies/TextStrategy';
import { useConfiguration } from './configuration';

export * from './component';

export const scentTemplate: PluginCallback = (scent: Scent) => {
    scent.configuration.merge({
        strategies: [
            new ForStrategy(),
            new IfStrategy(),
            new AttrStrategy(),
            new EventStrategy(),
            new ModelStrategy(),
            new TextStrategy()
        ]
    });
    useConfiguration(scent.configuration);
};
