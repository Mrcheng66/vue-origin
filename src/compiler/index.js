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


}