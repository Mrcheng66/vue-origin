import { createElementVNode, createTextVNode } from "./vdom/index"

function patch(vnode, el) {
  console.log(vnode)
}

export function initLifeCycle(Vue) {
  Vue.prototype._update = function (vnode) {
    // 将虚拟dom转化为真实dom

    // patch 既有初始化的功能  又有更新的功能
    const vm = this
    const el = vm.$el

    patch(el, vnode)
    console.log('update', vnode)
  }

  Vue.prototype._c = function () {
    return createElementVNode(this, ...arguments)
  }

  Vue.prototype._v = function () {
    return createTextVNode(this, ...arguments)
  }

  Vue.prototype._s = function (value) {
    if (typeof value !== 'object') {
      return value
    }
    return JSON.stringify(value)
  }

  Vue.prototype._render = function () {
    // console.log(vm.name)
    // 当渲染的时候会去实例中取值，我们就可以将属性和视图绑定在一起
    return this.$options.render.call(this) // 通过ast语法转义
  }
}
// Vue的核心流程 1) 创造了响应式数据 2) 模板转换成ast语法树 3) 将ast语法树转换成render函数 
// 4) 后续每次数据更新可以只执行render 函数(无需再次执行ast转换的过程)

// render 函数会产生虚拟节点(使用响应式数据)
// 根据生成的虚拟节点生成真实DOM
export function mountComponent(vm, el) {
  // console.log(vm)
  vm.$el = el

  // 1、调用render方法产生虚拟节点, 虚拟DOM
  vm._update(vm._render()) // vm._render()其实就是执行的 vm.render()
  // 2、根据虚拟DOM产生真实DOM

  // 3、插入到el元素中
  
}


