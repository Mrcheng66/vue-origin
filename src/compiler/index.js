import { parseHTML } from "./parse"

// vue3 采用的不是使用正则
// 对模板进行编译处理
// function parseHTML
// 对模板进行编译处理
export function compileToFunction(template) {

  // 1 将template 转换成ast 语法树
  let ast = parseHTML(template)
  console.log(ast);
  // 2 生成render 方法（render 方法执行后的返回的结果就是虚拟dom）
  /* 
    render() {
      return _c('div', {id: 'app'}, _c('div', {style: {color: 'red'}}, _v(_s(name) + 'hello'),
      _c('span', undefind, _v(_s(age)))))
    }
  */
  codegen(ast)
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

    str += `${attr.name}:${JSON.stringify(attr.value)},`
  }
  return `{${str.slice(0, -1)}}`
}

function genChildren(ast) {
  const children = ast.children
  if (children) {
    return children.map(child => genChild(child)).join()
  } else {
    return ''
  }
}

function genChild(node) {
  if (node.type === 1) { // 
    return codegen(node)
  } else {
    // 文本
    return '111'
  }
}

function codegen(ast) {
  console.log(ast);
  let children = genChildren(ast)
  let code = (`_c('${ast.tag}', ${
      ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'
    }${
      ast.children.length ? `,${children}` : ''
    }
  )`)

  console.log(code);
}