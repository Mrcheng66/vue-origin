import { parseHTML } from "./parse"
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // 匹配到的内容就是我们表达式的变量
// vue3 采用的不是使用正则
// 对模板进行编译处理
// function parseHTML
// 对模板进行编译处理
export function compileToFunction(template) {

  // 1 将template 转换成ast 语法树
  let ast = parseHTML(template)
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
  let code = codegen(ast)
  console.log(code)
  code = `with(this){return ${code}}` // with 语句改变作用域范围(改变取值)
  let render = new Function(code) // 根据代码生成函数
  // console.log(render.toString());
  return render
}

function genProps(attrs) {
  let str = '' // name value
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i]
    if (attr.name === 'style') {
      // color: red; background: yellow => { color: 'red' }
      let obj = {}
      attr.value.split(';').forEach(item => {
        let [key, value] = item.split(':')
        obj[key] = value
      });
      attr.value = obj
    }

    str += `${attr.name}:${JSON.stringify(attr.value)},` // a: b, c: d,
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
    let text = node.text
    if (!defaultTagRE.test(text)) {
      return `_v(${JSON.stringify(text)})`
    } else {
      // _v( _s(name) + 'hello' + _s(name))
      let tokens = []
      let match;
      defaultTagRE.lastIndex = 0 // exec 使用的时候 正则中存在 /g 的话会记录位置的所以需要重置
      let lastIndex = 0
      while(match = defaultTagRE.exec(text)) {
        // console.log(match, '----');
        let index = match.index
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)))
        }

        tokens.push(`_s(${match[1].trim()})`)
        lastIndex = index + match[0].length
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)))
      }
      return `_v(${tokens.join('+')})`
    }
  }
}

function codegen(ast) {
  // console.log(ast);
  let children = genChildren(ast)
  let code = (`_c('${ast.tag}', ${
      ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'
    }${
      ast.children.length ? `,${children}` : ''
    }
  )`)
  
  return code 
}