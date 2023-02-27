
// Regular Expressions for parsing tags and attributes
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`) // 他匹配到的分组是一个标签名 <xxx 匹配到的是开始 标签的名字
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)  // 匹配的是</xxx> 最终匹配到的分组就是结束标签的名字
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/  // 匹配属性
// 属性的第一个分组就是属性的key value 就是分组3/分组4/分组5
const startTagClose = /^\s*(\/?)>/ // <div> <br/> 自闭合标签等
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // 匹配到的内容就是我们表达式的变量
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const doctype = /^<!DOCTYPE [^>]+>/i
// #7298: escape - to avoid being passed as HTML comment when inlined in page
const comment = /^<!\--/
const conditionalComment = /^<!\[/

export function parseHTML(html) { // html 最开始肯定是一个<  
  // 每次解析完一个 标签/属性 等就删除掉
  function advance(length) {
    html = html.substring(length)
  }

  const ELEMENT_TYPE = 1
  const TEXT_TYPE = 3
  const stack = [] // 用于存放元素栈
  let currentParent // 指向栈中的最后一个
  let root

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
    let node = createASTElement(tag, attrs) // 创建一个ast节点
    if (!root) { // 看一下是否是空树
      root = node // 如果是空树则当前是树的根节点
    }

    if (currentParent) {
      node.parent = currentParent // 赋予了parent 属性
      currentParent.children.push(node) // 当前节点children增加
    }
    stack.push(node)
    currentParent = node // currentParent 是栈中的最后一个
  }

  function charts(text) {
    // console.log(text); // 文本直接放在当前指向的节点中
    // text = text.replace(/\s/g, '')
    // text && currentParent.children.push({
    currentParent.children.push({
      type: TEXT_TYPE,
      text,
      parent: currentParent
    })
  }

  function end(tags) {
    // console.log(tags); // 遇到结束标签必然是stack中最后一个元素（即当前元素）的结束
    stack.pop()
    currentParent = stack[stack.length - 1]
  }

  function parsetStartTag() {
    const start = html.match(startTagOpen)

    // console.log(start);
    if (start) {
      const match = {
        tagName: start[1], // 标签名
        attrs: []
      }
      advance(start[0].length)
      // 如果不是开始标签的结束就一直匹配下去
      let attr, end;
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push({name: attr[1], value: attr[3] || attr[4] || attr[5] || true})
      }

      if (end) {
        advance(end[0].length)
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
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue;
      }
      // 匹配结束标签
      let endTagMatch = html.match(endTag)
      if (endTagMatch) {
        end(endTagMatch[1])
        advance(endTagMatch[0].length)
        continue;
      }
    }
    // 文本
    if (textEnd > 0) {
      let text = html.substring(0, textEnd); // 文本内容
      if (text) {
        charts(text)
        advance(text.length)
      }
    }
  }
  // console.log(root);

  return root
}
