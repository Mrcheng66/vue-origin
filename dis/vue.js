(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function initLifeCycle(Vue) {
    Vue.prototype._update = function (node) {
      console.log('update', node);
    };

    Vue.prototype._render = function () {
      const vm = this;
      // console.log(vm.name)
      return vm.$options.render.call(vm)
    };

    Vue.prototype._c = function () {
    };

    Vue.prototype._v = function () {
    };

    Vue.prototype._s = function (value) {
      return JSON.stringify(value)
    };
  }


  // Vue的核心流程 1) 创造了响应式数据 2) 模板转换成ast语法树 3) 将ast语法树转换成render函数 
  // 4) 后续每次数据更新可以只执行render 函数(无需再次执行ast转换的过程)

  // render 函数会产生虚拟节点(使用响应式数据)
  // 根据生成的虚拟节点生成真实DOM
  function mountComponent(vm, el) {
    // console.log(vm)

    // 1、调用render方法产生虚拟节点, 虚拟DOM
    vm._update(vm._render()); // vm._render()其实就是执行的 vm.render()
    // 2、根据虚拟DOM产生真实DOM

    // 3、插入到el元素中
    
  }

  // Regular Expressions for parsing tags and attributes
  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 他匹配到的分组是一个标签名 <xxx 匹配到的是开始 标签的名字
  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);  // 匹配的是</xxx> 最终匹配到的分组就是结束标签的名字
  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;  // 匹配属性
  // 属性的第一个分组就是属性的key value 就是分组3/分组4/分组5
  const startTagClose = /^\s*(\/?)>/; // <div> <br/> 自闭合标签等

  function parseHTML(html) { // html 最开始肯定是一个<  
    // 每次解析完一个 标签/属性 等就删除掉
    function advance(length) {
      html = html.substring(length);
    }

    const ELEMENT_TYPE = 1;
    const TEXT_TYPE = 3;
    const stack = []; // 用于存放元素栈
    let currentParent; // 指向栈中的最后一个
    let root;

    // 最终需要转换成一颗抽象语法树
    function createASTElement(tag, attrs) {
      return {
        tag,
        attrs,
        type: ELEMENT_TYPE,
        children: [],
        parent: null
      }
    }

    function start(tag, attrs) {
      let node = createASTElement(tag, attrs); // 创建一个ast节点
      if (!root) { // 看一下是否是空树
        root = node; // 如果是空树则当前是树的根节点
      }

      if (currentParent) {
        node.parent = currentParent; // 赋予了parent 属性
        currentParent.children.push(node); // 当前节点children增加
      }
      stack.push(node);
      currentParent = node; // currentParent 是栈中的最后一个
    }

    function charts(text) {
      // console.log(text); // 文本直接放在当前指向的节点中
      text = text.replace(/\s/g, '');
      text && currentParent.children.push({
      // currentParent.children.push({
        type: TEXT_TYPE,
        text,
        parent: currentParent
      });
    }

    function end(tags) {
      // console.log(tags); // 遇到结束标签必然是stack中最后一个元素（即当前元素）的结束
      stack.pop();
      currentParent = stack[stack.length - 1];
    }

    function parsetStartTag() {
      const start = html.match(startTagOpen);

      // console.log(start);
      if (start) {
        const match = {
          tagName: start[1], // 标签名
          attrs: []
        };
        advance(start[0].length);
        // 如果不是开始标签的结束就一直匹配下去
        let attr, end;
        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          advance(attr[0].length);
          match.attrs.push({name: attr[1], value: attr[3] || attr[4] || attr[5] || true});
        }

        if (end) {
          advance(end[0].length);
        }
        // console.log(match);
        return match
      }
      return false
    }

    while (html) {
      // 如果textEnd 为0 说明是一个开始标签或者结束标签
      // 如果textEnd > 0 说明是文本的结束位置
      let textEnd = html.indexOf('<'); // 如果indexOf中的索引是0 则说明是个标签

      if (textEnd == 0) {
        const startTagMatch = parsetStartTag();
        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        }
        // 匹配结束标签
        let endTagMatch = html.match(endTag);
        if (endTagMatch) {
          end(endTagMatch[1]);
          advance(endTagMatch[0].length);
          continue;
        }
      }
      // 文本
      if (textEnd > 0) {
        let text = html.substring(0, textEnd); // 文本内容
        if (text) {
          charts(text);
          advance(text.length);
        }
      }
    }
    // console.log(root);

    return root
  }

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // 匹配到的内容就是我们表达式的变量
  // vue3 采用的不是使用正则
  // 对模板进行编译处理
  // function parseHTML
  // 对模板进行编译处理
  function compileToFunction(template) {

    // 1 将template 转换成ast 语法树
    let ast = parseHTML(template);
    // console.log(ast);
    // console.log(ast);
    // 2 生成render 方法（render 方法执行后的返回的结果就是虚拟dom）
    /* 
      _c: creatElement()
      _v: 创建vnode
      _s: 字符串
      render() {
        return _c('div', {id: 'app'}, _c('div', {style: {color: 'red'}}, _v(_s(name) + 'hello'),
        _c('span', undefind, _v(_s(age)))))
      }
    */

    // 模板引擎的实现原理就是 with + new Function()
    let code = codegen(ast);
    console.log(code);
    code = `with(this){return ${code}}`; // with 语句改变作用域范围(改变取值)
    let render = new Function(code); // 根据代码生成函数
    // console.log(render.toString());
    return render
  }

  function genProps(attrs) {
    let str = ''; // name value
    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i];
      if (attr.name === 'style') {
        // color: red; background: yellow => { color: 'red' }
        let obj = {};
        attr.value.split(';').forEach(item => {
          let [key, value] = item.split(':');
          obj[key] = value;
        });
        attr.value = obj;
      }

      str += `${attr.name}:${JSON.stringify(attr.value)},`; // a: b, c: d,
    }
    return `{${str.slice(0, -1)}}`
  }

  function genChildren(ast) {
    const children = ast.children;
    if (children) {
      return children.map(child => genChild(child)).join(',')
    } else {
      return ''
    }
  }

  function genChild(node) {
    if (node.type === 1) { // 
      return codegen(node)
    } else {
      // 文本
      let text = node.text;
      if (!defaultTagRE.test(text)) {
        return `_v(${JSON.stringify(text)})`
      } else {
        // _v( _s(name) + 'hello' + _s(name))
        let tokens = [];
        let match;
        defaultTagRE.lastIndex = 0; // exec 使用的时候 正则中存在 /g 的话会记录位置的所以需要重置
        let lastIndex = 0;
        while(match = defaultTagRE.exec(text)) {
          // console.log(match, '----');
          let index = match.index;
          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }

          tokens.push(`_s(${match[1].trim()})`);
          lastIndex = index + match[0].length;
        }
        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }
        return `_v(${tokens.join('+')})`
      }
    }
  }

  function codegen(ast) {
    // console.log(ast);
    let children = genChildren(ast);
    let code = (`_c('${ast.tag}', ${
      ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'
    }${
      ast.children.length ? `,${children}` : ''
    }
  )`);
    
    return code 
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
    // console.log(data);

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

      mountComponent(vm); // 组件的挂载

      // ops.render // 最终可以获取render 方法

      // script 标签引用的vue.global.js 这个编译过程是在浏览器进行的
      // runtime 是不包含编译的， 整个编译是打包的时候通过loader来转义.vue 文件的
      // 用runtime的时候不能在new Vue配置中使用template
    };
  }

  function Vue(option) {
    this._init(option);
  }

  initMixin(Vue);
  initLifeCycle(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
