import babel from 'rollup-plugin-babel'

// rollup默认可以导出一个对象，作为打包的配置文件
export default {
  input: './src/index.js', // 入口
  output: {
    file: './dis/vue.js', // 出口
    name: 'Vue', // 在全局增加一个属性可以通过new Vue()
    format: 'umd', //  打包格式： esm es6模块， commonjs模块  iife自执行函数 umd  
    sourcemap: true // 希望可以代码调试
  },
  Plugins: [
    // babelrc 文件配置也可以直接卸载babel函数方法中写参数
    babel({
      exclude: 'node_modules/**' // 排除node_modules下所有文件** 代表任意文件下任意文件
    })
  ]
}
