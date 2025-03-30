import { initLifeCycle } from "./lifecycle"
import { initMixin } from "./init"
import { initGlobalAPI } from "./globalApi"
import { initStateMixin } from "./state"
import { compileToFunction } from "./compiler/index"
import { createElm,patch } from "./vdom/patch"

function Vue(option) {
  this._init(option)
}
initMixin(Vue)
initLifeCycle(Vue)
initGlobalAPI(Vue)
initStateMixin(Vue)
// ------------- 为了方便观察前后的虚拟节点-- 测试的-----------------

let render1 = compileToFunction(`<ul  a="1" style="color:blue">
  <li>a</li>
  <li>b</li>
  <li>c</li>
  <li>d</li>
</ul>`);
let vm1 = new Vue({ data: { name: 'zf' } })
let prevVnode = render1.call(vm1)

let el = createElm(prevVnode);
document.body.appendChild(el)



let render2 = compileToFunction(`<ul  a="1"  style="color:red;">
  <li >e</li>
  <li>m</li>
  <li>p</li>
  <li >q</li>
  
</ul>`);
let vm2 = new Vue({ data: { name: 'zf' } })
let nextVnode = render2.call(vm2);


// 直接将新的节点替换掉了老的，  不是直接替换 而是比较两个人的区别之后在替换.  diff算法
// diff算法是一个平级比较的过程 父亲和父亲比对， 儿子和儿子比对 

setTimeout(() => {
  patch(prevVnode, nextVnode)


  // let newEl = createElm(nextVnode);
  // el.parentNode.replaceChild(newEl,el)
}, 1000)

export default Vue