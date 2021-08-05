export function getAllElements(ele: Element): Element[] {
    return [ele].concat([...(ele.children || [])].map(e => getAllElements(e)).flat());
}