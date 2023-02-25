// 我们希望重写数组中的部分方法

let oldArrayProto = Array.prototype // 获取数组的原型
 
// 通过 newArrayProto.__proto__ = oldArrayProto
export let newArrayProto = Object.create(oldArrayProto) // 生成新的(不是拷贝， 是复制)

let methods = [
  'push',
  'pop',
  'shift',
  'unshift',
  'reverse',
  'sort',
  'splice'
]

methods.forEach(method => {
  newArrayProto[method] = function(...args) { // 这里重写了数组的方法
    const result = oldArrayProto[method].call(this, ...args) // 内部调用原来的方法， 函数的劫持， 切片编程
    console.log('method', method);
    // 但是对数组进行追加额外的对象数据需要再次进行劫持
    let inserted;
    let ob = this.__ob__;
    switch (method) {
      // 需要对新增的数据再次进行劫持
      case 'push':
      case 'unshift':
        inserted = args
        break;
      case 'splice': 
        // arr.splice(0, 1, {a: 1}, {b: 2})
        // args 是个数组，只截取新增的数据即可
        inserted = args.slice(2)
        break
      default:
        break;
    }
    console.log(inserted);
    // 对新增的内容再次进行观测 inserted 是个数组哦
    // 是不是想调用observeArray(data) 就可以了， 但是访问不到🐶。。。
    if (inserted) {
      // 这里的this 不就是外部的data吗，因为外部是data调用的啊，
      // 所以只能在外部的class Observer 中给data加上一个属性这里就能访问到observeArray(）了
      // console.log(this);
      ob.observeArray(inserted)
    }
    return result
  }
})
