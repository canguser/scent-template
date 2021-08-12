const { HtmlRenderer, reactContext } = window.scent.template;

const renderer = new HtmlRenderer({
    element: '#app',
    directives: [
        {
            name: 'if',
            isScoped: true,
            render({ params, target, trans = {} }) {
                const { result } = params;
                const { lastAssert } = trans;
                if (lastAssert === result) {
                    return;
                }
                trans.lastAssert = result;
                if (!result) {
                    const commentNode = document.createComment('if');
                    trans.tempNode = commentNode;
                    target.parentElement.replaceChild(commentNode, target);
                } else if (trans.tempNode) {
                    trans.tempNode.parentElement.replaceChild(target, trans.tempNode);
                }
                // console.log(params);
                // console.log(target);
                // console.log(trans);
            }
        }
    ]
});

const context = reactContext(renderer, {
    name: 'ryan',
    gender: 'male',
    age: '25'
});

renderer.afterRendered(() => {
    console.log('rendered');
});

renderer.mount();

