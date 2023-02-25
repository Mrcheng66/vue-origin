(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function observe(data) {
    // 劫持数据
    console.log(data);
  }

  function initState(vm) {
    // 获取所有选项
    const opts = vm.$options;

    if (opts.data) {
      initData(vm);
    }

  }

  function initData(vm) {
    let data = vm.$options.data; // data可能是函数或者对象

    data = typeof data === 'function' ? data.call(vm) : data;
    // 对数据进行劫持 vue2中采用的是一个Objec.defineProperty
    observe(data);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      console.log(this); // 这里的this都是实例
      // vm.$options就是获取用户的配置选项
      const vm = this;
      vm.$options = options; // 将用户的选项挂载到实例上
      // 初始化状态
      initState(vm);
    };
  }

  function Vue(option) {
    this._init(option);
  }

  initMixin(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
