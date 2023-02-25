(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  // 对模板进行编译处理
  function compileToFunction(template) {
    console.log(template);

    // 1 将template 转换成ast 语法树

    // 2 生成render 方法（render 方法执行后的返回的结果就是虚拟dom）

    
  }

  // 我们希望重写数组中的部分方法

  let oldArrayProto = Array.prototype; // 获取数组的原型
   
  // 通过 newArrayProto.__proto__ = oldArrayProto
  let newArrayProto = Object.create(oldArrayProto); // 生成新的(不是拷贝， 是复制)

  let methods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'reverse',
    'sort',
    'splice'
  ];

  methods.forEach(method => {
    newArrayProto[method] = function(...args) { // 这里重写了数组的方法
      const result = oldArrayProto[method].call(this, ...args); // 内部调用原来的方法， 函数的劫持， 切片编程
      console.log('method', method);
      // 但是对数组进行追加额外的对象数据需要再次进行劫持
      let inserted;
      let ob = this.__ob__;
      switch (method) {
        // 需要对新增的数据再次进行劫持
        case 'push':
        case 'unshift':
          inserted = args;
          break;
        case 'splice': 
          // arr.splice(0, 1, {a: 1}, {b: 2})
          // args 是个数组，只截取新增的数据即可
          inserted = args.slice(2);
          break
      }
      console.log(inserted);
      // 对新增的内容再次进行观测 inserted 是个数组哦
      // 是不是想调用observeArray(data) 就可以了， 但是访问不到🐶。。。, 只能通过额外挂载参数的方法
      if (inserted) {
        // 这里的this 不就是外部的data吗，因为外部是data调用的啊，
        // 所以只能在外部的class Observer 中给data加上一个属性这里就能访问到observeArray(）了
        // console.log(this);
        ob.observeArray(inserted);
      }
      return result
    };
  });

  function observe(data) {
    // 劫持数据
    console.log(data);

    // 只对对象进行劫持
    if (typeof data !== 'object' || data === null) return

    // 说明这个对象被代理过了
    if (data.__ob__ instanceof Observer) {
      return data.__ob__;
    } 
    // 如果一个对象被劫持过了， 那就不需要劫持了（要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过）
    return new Observer(data)
    
  }
  class Observer {
    constructor(data) {
      // object.definerProperty 只能劫持已经存在的数据，新增的和删除的并不能感知。
      // vue2 里面会为此单独设置$set $delete
      // data.__ob__ = this // 给数据加了一个标识，如果数据上有__ob__则说明这个属性被观测过
      // (但是直接放在这里会栈内存溢出，因为下面还有walk函数循环， 下面有个observe递归)
      // 所以将__ob__ 转换成不可枚举
      Object.defineProperty(data, '__ob__', {
        value: this,
        enumerable: false // 将__ob__转换为不可枚举（循环的时候无法获取）
      });

      // 但是针对data中的数组数据每一项都添加get(), set() 性能太差了， 且不能监听到数组的push, pop 等方法
      if (Array.isArray(data)) {
        // 所以在这里我们重写数组中的方法 七个变异方法是可以修改数组本身的
        data.__proto__ = newArrayProto;
        this.observeArray(data); // 如果数组中放的是对象的时候
      } else {
        this.walk(data);
      }
    }

    walk(data) {
      // 循环对象 对属性依次劫持
      // 重写定义属性 性能差
      Object.keys(data).forEach(key => defineReactive(data, key, data[key]));
    }

    observeArray(data) { // 观测数组中的对象数据
      data.forEach(item => observe(item));
    }
  }

  function defineReactive(target, key, value) { // 闭包 属性劫持
    observe(value);  // 递归， 比如data中的属性还是一个对象的场景
    Object.defineProperty(target, key, {
      get() {
        // 取值的时候会执行get
        return value
      },
      set(newVal) {
        // 修改的时候会执行
        if (newVal === value) return
        value = newVal;
      }
    });
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

    // 下面的方法进行了属性 劫持但是在vm实例上并不会有data 属性直接访问 就是不能直接像项目里面 this.** 访问数据， 所以额外定义一个参数
    vm._data = data; // 这样又不便于直接的操作， 所以额外设置一层 _data的代理
    // 对数据进行劫持 vue2中采用的是一个Objec.defineProperty
    observe(data);

    // 将vm._data 用vm来代理
    Object.keys(data).forEach(key => proxy(vm, '_data', key));
  }

  function proxy(vm, target, key) {
    Object.defineProperty(vm, key, {
      get() {
        return vm[target][key]
      },
      set(newVal) {
        vm[target][key] = newVal;
      }
    });
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      console.log(this); // 这里的this都是实例
      // vm.$options就是获取用户的配置选项
      const vm = this;
      vm.$options = options; // 将用户的选项挂载到实例上
      // 初始化状态
      initState(vm);

      // 实现数据挂载
      if (options.el) {
        vm.$mount(options.el);
      }
    };

    Vue.prototype.$mount = function (el) {
      const vm = this;
      // 当前的挂载元素
      el = document.querySelector(el);
      let ops = vm.$options;
      if (!ops.render) { // 先看有没有写render
        let template;
        if (!ops.template && el) { // 没有写模板 但是写了el
          template = el.outerHTML;
        } else {
          if (el) {
            template = ops.template; // 如果有el 则采用模板的内容
          }
        }

        // console.log(template);
        // 写了template 就用写了的template
        if (template) {
          // 这里需要对模板进行编译
          const render = compileToFunction(template);

          ops.render = render; // jsx 最终会被编译成h('xxx')
        }
      }

      ops.render; // 最终可以获取render 方法

      // script 标签引用的vue.global.js 这个编译过程是在浏览器进行的
      // runtime 是不包含编译的， 整个编译是打包的时候通过loader来转义.vue 文件的
      // 用runtime的时候不能在new Vue配置中使用template
    };
  }

  function Vue(option) {
    this._init(option);
  }

  initMixin(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
