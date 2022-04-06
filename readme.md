# @scent/template

> `scent-js` 框架的模板引擎，通过指定不同类型的渲染区间来细化渲染内容。

## 框架特点
1. 采用原生 `JS` 直接操作 `DOM` 节点，不需要虚拟 `DOM`，提高渲染性能。
2. 不需要预先进行代码编译，适合大多数小型项目。
3. 框架轻量级，`mini` 源码大小不超过 30k。
4. 可配合任何可选的 `Reactive` 代理框架来进行渲染追踪，如：`@vue/reactivity`。

## 模版已实现特性
- 可以使用 `{}` 标签来渲染数据，支持 `{}` 内嵌模板。
- 通过使用 `s-bind:[name]` 或 `:[name]` 来绑定数据 HTML 标签属性。
- 通过使用 `s-on:[event]` 或 `@[event]` 来绑定事件。
- 通过使用 `s-if` 来控制渲染内容。
- 通过使用 `s-for:[var]=[list]` 来渲染数组内容。
- 通过使用暴露出的方法 `createComponent()` 来创建组件。
- 通过在组件中使用 `<slot></slot>` 和 `<div slot="body">` 配合来组合组件插槽。
- 通过使用 `s-model:[name].[event]` 来双向绑定数据及事件。
- 实现组件通讯
    - 父级调用子级使用 `instance.getRef('[name]')[method]()` 方法。
    - 子级传递给父级使用 `instance.target.dispatchEvent(event)` 方法。
- 通过 `proxyAdaptor` 来指定任何其他代理框架用于渲染追踪，推荐使用 `@vue/reactivity`。