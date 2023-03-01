import { creatElementVNode, creatTextVNode } from "./vdom/index"

export function initLifeCycle(Vue) {
  Vue.prototype._update = function (node) {
    console.log('update', node)
  }

  Vue.prototype._render = function () {
    const vm = this
    // console.log(vm.name)
    return vm.$options.render.call(vm)
  }

  Vue.prototype._c = function () {
    creatElementVNode()
  }

  Vue.prototype._v = function () {
    creatTextVNode()
  }

  Vue.prototype._s = function (value) {
    return JSON.stringify(value)
  }
}

function creatEle() {
  
}


// Vue的核心流程 1) 创造了响应式数据 2) 模板转换成ast语法树 3) 将ast语法树转换成render函数 
// 4) 后续每次数据更新可以只执行render 函数(无需再次执行ast转换的过程)

// render 函数会产生虚拟节点(使用响应式数据)
// 根据生成的虚拟节点生成真实DOM
export function mountComponent(vm, el) {
  // console.log(vm)

  // 1、调用render方法产生虚拟节点, 虚拟DOM
  vm._update(vm._render()) // vm._render()其实就是执行的 vm.render()
  // 2、根据虚拟DOM产生真实DOM

  // 3、插入到el元素中
  
}


