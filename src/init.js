import { callHook, mountComponent } from "./lifecycle";
import { compileToFunction } from "./compiler/index";
import { initState } from "./state";
import { mergeOptions } from "../utils";

export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    console.log(this); // 这里的this都是实例
    // vm.$options就是获取用户的配置选项
    const vm = this

    // 我们定义的全局指令/过滤器 都会挂在实例上
    vm.$options = mergeOptions(this.constructor.options,options) // 将用户的选项挂载到实例上
    callHook(vm, 'befoerCreate')
    // 初始化状态
    initState(vm)
    callHook(vm, 'created')
    // console.log(vm.$options);
    // 实现数据挂载
    if (options.el) {
      vm.$mount(options.el)
    }
  }

  Vue.prototype.$mount = function (el) {
    const vm = this
    // 当前的挂载元素
    el = document.querySelector(el)
    let ops = vm.$options
    if (!ops.render) { // 先看有没有写render
      let template;
      if (!ops.template && el) { // 没有写模板 但是写了el
        template = el.outerHTML
      } else {
        if (el) {
          template = ops.template // 如果有el 则采用模板的内容
        }
      }

      // console.log(template);
      // 写了template 就用写了的template
      if (template) {
        // 这里需要对模板进行编译
        const render = compileToFunction(template);

        ops.render = render // jsx 最终会被编译成h('xxx')
      }
    }

    mountComponent(vm, el) // 组件的挂载

    // ops.render // 最终可以获取render 方法

    // script 标签引用的vue.global.js 这个编译过程是在浏览器进行的
    // runtime 是不包含编译的， 整个编译是打包的时候通过loader来转义.vue 文件的
    // 用runtime的时候不能在new Vue配置中使用template
  }
}

