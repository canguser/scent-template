import { configuration } from '@scent/core/typing';
import { ForStrategy } from './stragtegies/ForStrategy';
import { IfStrategy } from './stragtegies/IfStrategy';
import { AttrStrategy } from './stragtegies/AttrStrategy';
import { EventStrategy } from './stragtegies/EventStrategy';
import { ModelStrategy } from './stragtegies/ModelStrategy';
import { TextStrategy } from './stragtegies/TextStrategy';

configuration.override({
    strategies: [
        new ForStrategy(),
        new IfStrategy(),
        new AttrStrategy(),
        new EventStrategy(),
        new ModelStrategy(),
        new TextStrategy()
    ]
});
export * from './component';
export * from '@scent/core';
