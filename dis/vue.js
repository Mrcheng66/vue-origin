(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  let id$1 = 0;
  class Dep {
    // 属性的dep要收集watcher
    constructor() {
      this.id = id$1++; // 属性dep要收集watcher
      this.subs = []; // 这里存放这当前属性对应的watcher 有哪些
    }
    depend() {
      // this.subs.push(Dep.target) // 这里我们不希望放重复的watcher，而且方才只是一个单向的关系
      //（因为可能在模板中多次使用同一属性， 没有必要多次收集watcher）
      // dep -> watcher (watcher 记录dep)
      
      Dep.target.addDep(this); // Dep.target 这个是watcher 哦, 就是让watcher记住dep了
      
      // dep 和 watcher 是一个多对多的关系（一个属性可以在多个组件中使用 dep -》 多个watcher）
      // 一个组件中由多个属性组成（一个watcher -》 对应多个dep）
    }

    addSub(watcher) {
      this.subs.push(watcher);
    }

    notify() {
      this.subs.forEach(wathcer => {
        wathcer.update();
      });
    }
  }

  Dep.target = null;

  let stack = [];
  function pushTarget(watcher) {
    stack.push(watcher);
    Dep.target = watcher;
  }

  function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
  }

  // 1 当我们创建渲染watcher的时候 我们会把当前的渲染watcher 放到Dep.target 上
  // 2 调用_render() 会取值 走到get上


  // 每个属性都有一个dep（属性就是被观察者）， watcher就是观察者（属性变化了会通知观察者来更新） -》 观察者模式
  let id = 0;
  class Watcher {
    constructor(vm, expOrFn, options, cb) {
      this.id = id++;
      this.vm = vm;
      this.renderWatcher = options;
      if (typeof expOrFn === 'string') {
        this.getter = function () {
          return vm[expOrFn]
        };
      } else {
        this.getter = expOrFn; // geter 意味着调用这个函数可以触发取值操作
      }
      this.deps = []; // 让watcher记住dep也是为了组件卸载和计算属性的实现
      this.depsId = new Set();
      this.cb = cb;
      this.lazy = options.lazy; // 判断计算属性
      this.dirty = this.lazy; // 缓存值，判断更新
      this.value = this.lazy ? undefined : this.get();
      this.user = options.user; // 表示是否是用户自己的watcher
    }
    // 判断dirty重新执行
    evaluate() {
      this.value = this.get(); // 获取用户函数的返回值，并且还要标记为脏
      this.dirty = false;
    }
    get() {
      // Dep.target = this // 静态属性就是只有一份
      pushTarget(this);
      let value = this.getter.call(this.vm); // 会去vm上取值
      // Dep.target = null // 渲染完毕就清空（清空是为了保证只有在模板里面才收集，在vm上获取属性是不收集的）
      popTarget();
      return value
    }
    depend() {
      let i = this.deps.length;
      while (i--) {
        this.deps[i].depend(); // 让计算属性watcher 也收集渲染watcher
      }
    }

    addDep(dep) {
      let id = dep.id;
      if(!this.depsId.has(id)) {
        this.deps.push(dep);
        this.depsId.add(id);
        dep.addSub(this); // watcher记住了dep了而且去重了, 此时dep 也记住watcher了
      }
    }

    update() {
      if (this.lazy) {
        // 如果是计算属性 依赖的值变化了 就标记计算属性是脏值了
        this.dirty = true;  
      } else {
        // this.get() // 重新渲染更新 （不能直接同步更新，多次set值会重复渲染）
        queueWatcher(this);
      }
    }

    run() {
      let oldVal = this.value;
      let newVal = this.get();
      if (this.user) {
        this.cb.call(this.vm, newVal, oldVal);
      }
    }
  }

  let queue = [];
  let has = {};
  let pending = false; // 防抖

  function flushSchedulerQueue() {
    let fulshQueue = queue.slice(0);
    queue = [];
    has = {};
    pending = false;
    fulshQueue.forEach(q => 
      q.run()
    );
  }

  function queueWatcher(watcher) {
    const id = watcher.id;
    if (!has[id]) {
      queue.push(watcher);
      has[id] = true;
      // 不管update 执行多少次，只执行一轮刷新操作

      if (!pending) {
        // setTimeout(flushSchedulerQueue, 0) // 不能直接写异步的宏任务，因为异步更新的时候获取不到真实dom数据
        nextTick(flushSchedulerQueue);
        pending = true;
      }
    }
  }

  // nextTick没有直接使用某个api  而是采用优雅降级的方式
  // 内部先采用的是Promise （ie不兼容）， 在看MutationObserver ， 
  // 还不支持可以考虑 ie专属的 setImmediate 最后 setTimeOut
  let callbacks = [];
  let waiting = false;
  function nextTick(cb) { // 先执行内部还是先用户的？
    callbacks.push(cb); // 维护nextTick中的callback方法
    if (!waiting) {
      // setTimeout(() => {
      //   flushCallBacks() // 最后一起刷新
      // }, 0)
      timerFunc();
      waiting = true;
    }
  }
  let timerFunc;
  if (Promise) {
    timerFunc = () => {
      Promise.resolve().then(flushCallBacks);
    };
  } else if (MutationObserver) {
    let observer = new MutationObserver(flushCallBacks);
    let textNode = document.createTextNode(1);
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = () => {
      textNode.textContent = 2;
    };
  } else if (setImmediate) {
    timerFunc = () => {
      setImmediate(flushCallBacks);
    };
  } else {
    timerFunc = () => {
      setTimeout(flushCallBacks);
    };
  }
  function flushCallBacks() {
    let cbs = callbacks.slice(0);
    callbacks = [];
    waiting = false;
    cbs.forEach(cb => cb());
  }

  // h() _c
  function createElementVNode(vm, tag, data, ...children) {
    if (data == null) {
      data = {};
    }
    // console.log(vm, arg, '----');
    let key = data.key;
    if (key) {
      delete data.key;
    }
    return vnode(vm, tag, key, data, children)
  }

  // _v()
  function createTextVNode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text)
  }

  // 和ast一样？ ast做的是语法层面的转化， 他描述的是语法本身（可以描述js， css， html）
  // 我们的虚拟dom 是描述dom元素的， 可以增加一些自定义属性（描述dom的）
  function vnode(vm, tag, key, data, children, text) {
    return {
      vm, tag, key, data, children, text
    }
  }

  function isSameVnode(vnode1,vnode2){
    return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key;
  }

  function createElm(vnode) {
    let { tag, data, children, text } = vnode;
    if (typeof tag === 'string') { // 标签
        vnode.el = document.createElement(tag); // 这里将真实节点和虚拟节点对应起来，后续如果修改属性了
        patchProps(vnode.el, {}, data);
        children.forEach(child => {
            vnode.el.appendChild(createElm(child));
        });
    } else {
        vnode.el = document.createTextNode(text);
    }
    return vnode.el
  }
  function patchProps(el, oldProps = {}, props = {}) {
    // 老的属性中有，新的没有  要删除老的
    let oldStyles = oldProps.style || {};
    let newStyles = props.style || {};
    for (let key in oldStyles) { // 老的样式中有 新的吗，没有则删除
        if (!newStyles[key]) {
            el.style[key] = '';
        }
    }

    for (let key in oldProps) { // 老的属性中有
        if (!props[key]) { // 新的没有删除属性
            el.removeAttribute(key);
        }
    }
    for (let key in props) { // 用新的覆盖老的
        if (key === 'style') { // style{color:'red'}
            for (let styleName in props.style) {
                el.style[styleName] = props.style[styleName];
            }
        } else {
            el.setAttribute(key, props[key]);
        }
    }

  }
  function patch(oldVNode, vnode) {
    // 写的是初渲染流程 
    const isRealElement = oldVNode.nodeType;
    if (isRealElement) {
        const elm = oldVNode; // 获取真实元素
        const parentElm = elm.parentNode; // 拿到父元素
        let newElm = createElm(vnode);
        parentElm.insertBefore(newElm, elm.nextSibling);
        parentElm.removeChild(elm); // 删除老节点

        return newElm
    } else {
        // 1.两个节点不是同一个节点  直接删除老的换上新的  （没有比对了）
        // 2.两个节点是同一个节点 (判断节点的tag和 节点的key)  比较两个节点的属性是否有差异 （复用老的节点，将差异的属性更新）
        // 3.节点比较完毕后就需要比较两人的儿子
        return patchVnode(oldVNode, vnode);
    }
  }

  function patchVnode(oldVNode, vnode) {
    if (!isSameVnode(oldVNode, vnode)) { // tag == tag key === key
        // 用老节点的父亲 进行替换
        let el = createElm(vnode);
        oldVNode.el.parentNode.replaceChild(el, oldVNode.el);
        return el;
    }

    // 文本的情况  文本我们期望比较一下文本的内容
    let el = vnode.el = oldVNode.el; // 复用老节点的元素
    if (!oldVNode.tag) { // 是文本
        if (oldVNode.text !== vnode.text) {
            el.textContent = vnode.text; // 用新的文本覆盖掉老的
        }
    }
    // 是标签   是标签我们需要比对标签的属性
    patchProps(el, oldVNode.data, vnode.data);

    // 比较儿子节点 比较的时候 一方有儿子 一方没儿子 
    //                       两方都有儿子

    let oldChildren = oldVNode.children || [];
    let newChildren = vnode.children || [];


    if (oldChildren.length > 0 && newChildren.length > 0) {
        // 完整的diff算法 需要比较两个人的儿子
        updateChildren(el, oldChildren, newChildren);

    } else if (newChildren.length > 0) { // 没有老的，有新的
        mountChildren(el, newChildren);
    } else if (oldChildren.length > 0) { // 新的没有  老的有 要删除
        el.innerHTML = ''; // 可以循环删除
    }
    return el;
  }

  function mountChildren(el, newChildren) {
    for (let i = 0; i < newChildren.length; i++) {
        let child = newChildren[i];
        el.appendChild(createElm(child));
    }
  }
  function updateChildren(el, oldChildren, newChildren) {
    // 我们操作列表 经常会是有  push shift pop unshift reverse sort这些方法  （针对这些情况做一个优化）
    // vue2中采用双指针的方式 比较两个节点
    let oldStartIndex = 0;
    let newStartIndex = 0;
    let oldEndIndex = oldChildren.length - 1;
    let newEndIndex = newChildren.length - 1;

    let oldStartVnode = oldChildren[0];
    let newStartVnode = newChildren[0];

    let oldEndVnode = oldChildren[oldEndIndex];
    let newEndVnode = newChildren[newEndIndex];


    function makeIndexByKey(children) {
        let map = {

        };
        children.forEach((child, index) => {
            map[child.key] = index;
        });
        return map;
    }
    let map = makeIndexByKey(oldChildren);
    // 循环的时候为什么要+key
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) { // 有任何一个不满足则停止  || 有一个为true 就继续走
        // 双方有一方头指针，大于尾部指针则停止循环
        if (!oldStartVnode) {
            oldStartVnode = oldChildren[++oldStartIndex];
        } else if (!oldEndVnode) {
            oldEndVnode = oldChildren[--oldEndIndex];
        } else if (isSameVnode(oldStartVnode, newStartVnode)) {
            patchVnode(oldStartVnode, newStartVnode); // 如果是相同节点 则递归比较子节点
            oldStartVnode = oldChildren[++oldStartIndex];
            newStartVnode = newChildren[++newStartIndex];
            // 比较开头节点
        } else if (isSameVnode(oldEndVnode, newEndVnode)) {
            patchVnode(oldEndVnode, newEndVnode); // 如果是相同节点 则递归比较子节点
            oldEndVnode = oldChildren[--oldEndIndex];
            newEndVnode = newChildren[--newEndIndex];
            // 比较开头节点
        } else if (isSameVnode(oldEndVnode, newStartVnode)) {
            patchVnode(oldEndVnode, newStartVnode);
            // insertBefore 具备移动性 会将原来的元素移动走
            el.insertBefore(oldEndVnode.el, oldStartVnode.el); // 将老的尾巴移动到老的前面去
            oldEndVnode = oldChildren[--oldEndIndex];
            newStartVnode = newChildren[++newStartIndex];
        }
        else if (isSameVnode(oldStartVnode, newEndVnode)) {
            patchVnode(oldStartVnode, newEndVnode);
            // insertBefore 具备移动性 会将原来的元素移动走
            el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling); // 将老的尾巴移动到老的前面去
            oldStartVnode = oldChildren[++oldStartIndex];
            newEndVnode = newChildren[--newEndIndex];
        } else {
            // 在给动态列表添加key的时候 要尽量避免用索引，因为索引前后都是从0 开始 ， 可能会发生错误复用 
            // 乱序比对
            // 根据老的列表做一个映射关系 ，用新的去找，找到则移动，找不到则添加，最后多余的就删除
            let moveIndex = map[newStartVnode.key]; // 如果拿到则说明是我要移动的索引
            if (moveIndex !== undefined) {
                let moveVnode = oldChildren[moveIndex]; // 找到对应的虚拟节点 复用
                el.insertBefore(moveVnode.el, oldStartVnode.el);
                oldChildren[moveIndex] = undefined; // 表示这个节点已经移动走了
                patchVnode(moveVnode, newStartVnode); // 比对属性和子节点
            } else {
                el.insertBefore(createElm(newStartVnode), oldStartVnode.el);
            }
            newStartVnode = newChildren[++newStartIndex];
        }

    }
    if (newStartIndex <= newEndIndex) { // 新的多了 多余的就插入进去
        for (let i = newStartIndex; i <= newEndIndex; i++) {
            let childEl = createElm(newChildren[i]);
            // 这里可能是像后追加 ，还有可能是向前追加
            let anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null; // 获取下一个元素
            // el.appendChild(childEl);
            el.insertBefore(childEl, anchor); // anchor 为null的时候则会认为是appendChild
        }
    }

    if (oldStartIndex <= oldEndIndex) { // 老的对了，需要删除老的
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
            if (oldChildren[i]) {
                let childEl = oldChildren[i].el;
                el.removeChild(childEl);
            }
        }
    }
    // 我们为了 比较两个儿子的时候 ，增高性能 我们会有一些优化手段
    // 如果批量像页面中修改出入内容 浏览器会自动优化 
  }

  function initLifeCycle(Vue) {
    Vue.prototype._update = function (vnode) {
      // 将虚拟dom转化为真实dom

      // patch 既有初始化的功能  又有更新的功能
      const vm = this;
      const el = vm.$el;

      vm.$el = patch(el, vnode);
      // console.log('update', vnode)
    };

    Vue.prototype._c = function () {
      return createElementVNode(this, ...arguments)
    };

    Vue.prototype._v = function () {
      return createTextVNode(this, ...arguments)
    };

    Vue.prototype._s = function (value) {
      if (typeof value !== 'object') return value
      return JSON.stringify(value)
    };

    Vue.prototype._render = function () {
      // console.log(vm.name)
      // 当渲染的时候会去实例中取值，我们就可以将属性和视图绑定在一起
      return this.$options.render.call(this) // 通过ast语法转义
    };
  }
  // Vue的核心流程 1) 创造了响应式数据 2) 模板转换成ast语法树 3) 将ast语法树转换成render函数 
  // 4) 后续每次数据更新可以只执行render 函数(无需再次执行ast转换的过程)

  // render 函数会产生虚拟节点(使用响应式数据)
  // 根据生成的虚拟节点生成真实DOM
  function mountComponent(vm, el) {
    // console.log(vm)
    vm.$el = el;

    // 1、调用render方法产生虚拟节点, 虚拟DOM
    // vm._update(vm._render()) // vm._render()其实就是执行的 vm.render()
    const updateComponent = () => {
      vm._update(vm._render());
    };
    // 2、根据虚拟DOM产生真实DOM

    // 3、插入到el元素中

    // 依赖收集监听
    // const watchers = new Watcher(vm, updateComponent, true /* isRenderWatcher */)
    // console.log(watchers);
    new Watcher(vm, updateComponent, true /* isRenderWatcher */);
  }

  function callHook(vm, hook) { // 调用钩子函数
    const handlers = vm.$options[hook];
    if(handlers) {
      handlers.forEach(handler => {
        handler.call(vm);
      });
    }
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

  function genProps(attrs) {
      let str = '';// {name,value}
      for (let i = 0; i < attrs.length; i++) {
          let attr = attrs[i];
          if (attr.name === 'style') {
              // color:red;background:red => {color:'red'}
              let obj = {};
              attr.value.split(';').forEach(item => { // qs 库
                  let [key, value] = item.split(':');
                  obj[key] = value;
              });
              attr.value = obj;
          }
          str += `${attr.name}:${JSON.stringify(attr.value)},`; // a:b,c:d,
      }
      return `{${str.slice(0, -1)}}`
  }
  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{ asdsadsa }}  匹配到的内容就是我们表达式的变量
  function gen(node) {
      if (node.type === 1) {
          return codegen(node);
      } else {
          // 文本
          let text = node.text;
          if (!defaultTagRE.test(text)) {
              return `_v(${JSON.stringify(text)})`
          } else {
              //_v( _s(name)+'hello' + _s(name))
              let tokens = [];
              let match;
              defaultTagRE.lastIndex = 0;
              let lastIndex = 0;
              // split
              while (match = defaultTagRE.exec(text)) {
                  let index = match.index; // 匹配的位置  {{name}} hello  {{name}} hello 
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
  function genChildren(children) {
      return children.map(child => gen(child)).join(',')
  }
  function codegen(ast) {
      let children = genChildren(ast.children);
      let code = (`_c('${ast.tag}',${ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'
        }${ast.children.length ? `,${children}` : ''
        })`);

      return code;
  }
  function compileToFunction(template) {

      // 1.就是将template 转化成ast语法树
      let ast = parseHTML(template);

      // 2.生成render方法 (render方法执行后的返回的结果就是 虚拟DOM)

      // 模板引擎的实现原理 就是 with  + new Function

      let code = codegen(ast);
      code = `with(this){return ${code}}`;
      let render = new Function(code); // 根据代码生成render函数

      //  _c('div',{id:'app'},_c('div',{style:{color:'red'}},  _v(_s(vm.name)+'hello'),_c('span',undefined,  _v(_s(age))))

      return render;
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
        // 这里的this 不就是外部的data吗，因为外部是data调用的 
        // 所以只能在外部的class Observer 中给data加上一个属性这里就能访问到observeArray(）了
        // console.log(this);
        ob.observeArray(inserted);
      }

      ob.dep.notify(); // 数组变化了  通知对应的watcher实现更新逻辑
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
      // 给每个对象都新增收集功能
      this.dep = new Dep();

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

  // 深层次嵌套会递归，递归多了性能就差，不存在属性监听不到，存在的属性要重写方法
  function dependArray(value) {
    for (let i = 0; i < value.length; i++) {
      const current = value[i];
      current.__ob__ &&  current.__ob__.dep.depend(); // 
      if (Array.isArray(current)) {
        dependArray(current );
      }
    }
  }

  function defineReactive(target, key, value) { // 闭包 属性劫持
    const childOb = observe(value);  // 递归， 比如data中的属性还是一个对象的场景,   childOb.dep用来收集依赖的
    let dep = new Dep(); // 怎么讲dep和watcher关联起来呢？
    // (默认会在渲染的时候创建一个watcher， 会将这个watcher 放在Dep全局静态属性target上)，之后执行_render
    // 去取值， 让当前的dep记住当前的watcher
    Object.defineProperty(target, key, {
      get() {
        if (Dep.target) {
          dep.depend(); // 让这个属性的收集器记住这个watcher

          if (childOb) {
            childOb.dep.depend();

            if (Array.isArray(value)) { // 如果劫持数组中还有数组的场景
              dependArray(value);
            }
          }
        }
        // 取值的时候会执行get
        return value
      },
      set(newVal) {
        // 修改的时候会执行
        if (newVal === value) return
        observe(newVal);
        value = newVal;
        dep.notify(); // 通知更新
      }
    });
  }

  function initState(vm) {
    // 获取所有选项
    const opts = vm.$options;
    if (opts.data) {
      // 数据
      initData(vm);
    }
    if (opts.computed) {
      // 计算属性
      initComputed(vm);
    }
    if (opts.watch) {
      // 监听器
      initWatch(vm);
    }
  }

  function initData(vm) {
    let data = vm.$options.data; // data可能是函数或者对象

    data = typeof data === "function" ? data.call(vm) : data;

    // 下面的方法进行了属性 劫持但是在vm实例上并不会有data 属性直接访问 就是不能直接像项目里面 this.** 访问数据， 所以额外定义一个参数
    vm._data = data; // 这样又不便于直接的操作， 所以额外设置一层 _data的代理
    // 对数据进行劫持 vue2中采用的是一个Objec.defineProperty
    observe(data);

    // 将vm._data 用vm来代理
    Object.keys(data).forEach((key) => proxy(vm, "_data", key));
  }

  function proxy(vm, target, key) {
    Object.defineProperty(vm, key, {
      get() {
        return vm[target][key];
      },
      set(newVal) {
        vm[target][key] = newVal;
      },
    });
  }

  function initComputed(vm) {
    const computed = vm.$options.computed;
    const watcher = vm._computedWatchers = {};
    for (const key in computed) {
      if (Object.hasOwnProperty.call(computed, key)) {
        const useDef = computed[key];
        
        // 我们需要监控 计算属性中get的变化
        const fn = typeof useDef === "function" ? useDef : useDef.get;
        // 如果直接new Watcher 默认就会执行fn， 所以在options中增加一个标识lazy
        // 将属性和watcher对应起来
        watcher[key] = new Watcher(vm, fn, {lazy: true});

        defineComputed(vm, key, useDef);
      }
    }
  }

  function defineComputed(target, key, useDef) {
    typeof useDef === "function" ? useDef : useDef.get;
    const setter = useDef.set || (() => {});
    // console.log(getter, setter);
    Object.defineProperty(target, key, {
      get: creatComputedGetter(key),
      set: setter,
    });
  }

  // 计算属性根本不会收集依赖，只会让自己的依赖属性去收集依赖
  function creatComputedGetter(key) {
    // 我们需要监测是否要执行这个getter
    return function () {
      const watcher = this._computedWatchers[key]; // 获取对应属性的watcher
      if (watcher.dirty) {
        // 如果是脏的就去执行用户传入的函数
        watcher.evaluate(); // 直接掉get不合适因为存在值变化重新执行的情况
      }
      if (Dep.target) { // 计算属性出栈后 还要渲染watcher  我应该让计算属性watcher里面的属性也去收集上层watcher（渲染watcher）
          watcher.depend();      
      }
      return watcher.value // 最后返回的是watcher上的值
    }
  }

  function initWatch(vm) {
    let watch = vm.$options.watch;
    // 
    for (const key in watch) {
      if (Object.hasOwnProperty.call(watch, key)) {
        const handler = watch[key]; // 字符串 数组 函数
        if (Array.isArray(handler)) {
          for (let i = 0; i < handler.length; i++) {
            creatWatcher(vm, key, handler[i]);
          }
        } else {
          creatWatcher(vm, key, handler);
        }
      }
    }
  }

  function creatWatcher(vm, key, handler) {
    // 字符串  函数
    if (typeof handler == 'string') {
      handler = vm[handler];
    }
    return vm.$watch(key, handler)
  }
  function initStateMixin(Vue) {
    // watch最终调用的都是这个方法
    Vue.prototype.$watch = function (expOrFn, cb, option = {}) {
      console.log(expOrFn, cb);

      new Watcher(this, expOrFn, {user: true}, cb);
    };

    Vue.prototype.$nextTick = nextTick;
  }

  const strats = {};
    const LIFE_CYCLE = ["beforeCreate", "created"];
    LIFE_CYCLE.forEach((hook) => {
      strats[hook] = function (p, c) {
        if (c) {
          if (p) {
            return p.concat(c);
          } else {
            return [c];
          }
        } else {
          return p;
        }
      };
    });
  function mergeOptions(parent, child) {
    const options = {};
    for (const key in parent) {
      mergeField(key);
    }

    for (const key in child) {
      if (!parent.hasOwnProperty(key)) {
        mergeField(key);
      }
    }

    function mergeField(key) {
      // 策略模式 避免if/else  因为mixin中可能存在多个和组件内同类型的键值的key （created，watch。。。）
      if (strats[key]) {
        options[key] = strats[key](parent[key], child[key]);
      } else {
        // 优先采用儿子， 再采用父亲
        options[key] = child[key] || parent[key];
      }
    }

    return options
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      console.log(this); // 这里的this都是实例
      // vm.$options就是获取用户的配置选项
      const vm = this;

      // 我们定义的全局指令/过滤器 都会挂在实例上
      vm.$options = mergeOptions(this.constructor.options,options); // 将用户的选项挂载到实例上
      callHook(vm, 'befoerCreate');
      // 初始化状态
      initState(vm);
      callHook(vm, 'created');
      // console.log(vm.$options);
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

      mountComponent(vm, el); // 组件的挂载

      // ops.render // 最终可以获取render 方法

      // script 标签引用的vue.global.js 这个编译过程是在浏览器进行的
      // runtime 是不包含编译的， 整个编译是打包的时候通过loader来转义.vue 文件的
      // 用runtime的时候不能在new Vue配置中使用template
    };
  }

  function initGlobalAPI(Vue) {
    // 静态属性
    Vue.options = {};
    
    Vue.mixin = function (mixin) {
      // 我们期望将用户的选项和 全局API进行合并
      // {} {created: function(){}} => {created: [fn()]}

      this.options = mergeOptions(this.options, mixin);

      return this;
    };
  }

  function Vue(option) {
    this._init(option);
  }
  initMixin(Vue);
  initLifeCycle(Vue);
  initGlobalAPI(Vue);
  initStateMixin(Vue);
  // ------------- 为了方便观察前后的虚拟节点-- 测试的-----------------

  let render1 = compileToFunction(`<ul  a="1" style="color:blue">
  <li>a</li>
  <li>b</li>
  <li>c</li>
  <li>d</li>
</ul>`);
  let vm1 = new Vue({ data: { name: 'zf' } });
  let prevVnode = render1.call(vm1);

  let el = createElm(prevVnode);
  document.body.appendChild(el);



  let render2 = compileToFunction(`<ul  a="1"  style="color:red;">
  <li >e</li>
  <li>m</li>
  <li>p</li>
  <li >q</li>
  
</ul>`);
  let vm2 = new Vue({ data: { name: 'zf' } });
  let nextVnode = render2.call(vm2);


  // 直接将新的节点替换掉了老的，  不是直接替换 而是比较两个人的区别之后在替换.  diff算法
  // diff算法是一个平级比较的过程 父亲和父亲比对， 儿子和儿子比对 

  setTimeout(() => {
    patch(prevVnode, nextVnode);


    // let newEl = createElm(nextVnode);
    // el.parentNode.replaceChild(newEl,el)
  }, 1000);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
