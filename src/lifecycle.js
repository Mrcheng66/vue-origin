import Watcher from "./observe/watcher";
import { createElementVNode, createTextVNode } from "./vdom/index"

function createElm(vnode) {
  let { tag, data, children, text } = vnode
  if (typeof tag == 'string') { // 标签
    vnode.el = document.createElement(tag) // 这里将真实的节点和虚拟节点对应起来, 后续如果修改了属性
    // 处理属性
    patchProps(vnode.el, data)
    // 递归添加子节点dom
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    });
  } else { // 文本节点
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

function patchProps(el, props) {
  for (const key in props) {
    if (key == 'style') {
      for (const styleName in props.style) {
        el.style[styleName] = props.style[styleName]
      }
    } else {
      el.setAttribute(key, props[key])
    }
  }
}

export function patch(oldVnode, vnode) {
  const isRealElement = oldVnode.nodeType
  if (isRealElement) {
    // 如果是真实dom (初渲染)
    const elm = oldVnode

    const parenElm = elm.parentNode; // 拿到父元素

    const newElm = createElm(vnode)
    // console.log(newElm)
    /* 
      先插入新节点 el，再删除老的 el 是为了避免在插入新节点之前，
      一些 DOM 元素被脚本等异步操作修改，导致渲染不准确的问题。

      如果先删除老的 el 再插入新的 el，那么在这个过程中，如果出现了异步操作，
      可能会对老的 el 进行修改，导致渲染不准确。而如果先插入新的 el，再删除老的 el，
      就能保证新的 el 能够正常渲染，避免了这个问题。
      同时，Vue 在插入新的 el 时，也会保证它处于合适的位置，避免了插入位置的错误
    */
    parenElm.insertBefore(newElm, elm.nextSibling) // 先插入新的 el
    parenElm.removeChild(elm) // 删除老的 el

    return newElm
  } else {
    // diff算法
  }
  console.log(vnode)
}

export function initLifeCycle(Vue) {
  Vue.prototype._update = function (vnode) {
    // 将虚拟dom转化为真实dom

    // patch 既有初始化的功能  又有更新的功能
    const vm = this
    const el = vm.$el

    vm.$el = patch(el, vnode)
    console.log('update', vnode)
  }

  Vue.prototype._c = function () {
    return createElementVNode(this, ...arguments)
  }

  Vue.prototype._v = function () {
    return createTextVNode(this, ...arguments)
  }

  Vue.prototype._s = function (value) {
    if (typeof value !== 'object') return value
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
  // vm._update(vm._render()) // vm._render()其实就是执行的 vm.render()
  const updateComponent = () => {
    vm._update(vm._render())
  }
  // 2、根据虚拟DOM产生真实DOM

  // 3、插入到el元素中

  // 依赖收集监听
  new Watcher(vm, updateComponent, true /* isRenderWatcher */)
}
