import { Scent, PluginCallback } from '@scent/core';
import { ForStrategy } from './stragtegies/ForStrategy';
import { IfStrategy } from './stragtegies/IfStrategy';
import { AttrStrategy } from './stragtegies/AttrStrategy';
import { EventStrategy } from './stragtegies/EventStrategy';
import { ModelStrategy } from './stragtegies/ModelStrategy';
import { TextStrategy } from './stragtegies/TextStrategy';
import { useConfiguration } from './configuration';
import { BasicStrategy } from './stragtegies/BasicStrategy';
import { HtmlStrategy } from './stragtegies/HtmlStrategy';

export * from './component';

export const scentTemplate: PluginCallback = (scent: Scent) => {
    console.log(scent)
    scent.configuration.merge({
        strategies: [
            new ForStrategy(),
            new IfStrategy(),
            new AttrStrategy(),
            new EventStrategy(),
            new ModelStrategy(),
            new HtmlStrategy(),
            new TextStrategy()
        ]
    }, {
        integralClasses: [BasicStrategy]
    });
    useConfiguration(scent.configuration);
};
