## Node 是什么

+ 用于编写服务器端应用
+ JavaScript 核心语法
+ 只是操作的对象不同

![image-20210308094311721](https://gitee.com/tianle_ytl/drawing-bed/raw/master/assets/202101/image-20210308094311721.png)

[Node.js v15.11.0 Documentation](https://nodejs.org/docs/latest-v15.x/api/index.html)

[Node.js v14.16.0 文档](http://nodejs.cn/api/)

[Node.js 入门教程](http://nodejs.cn/learn)

## 运行和调试

### Nodemon

监视代码修改，自动重启

```bash
npm i nodemon -g
nodemon helloworld
```

`Node/Basic/helloworld.js`

```javascript
const helloText = 'Hello world.';
console.log(helloText);
```

### Jest 单元测试

全局安装 jest 库

```bash
npm install jest -g
```

创建一个测试用例

`Node/Basic/__test__/helloworld`

```javascript
test('测试 Hello world', () => {
  const ret = require('../helloworld');
  console.log('helloworld -- ', ret);
  expect(ret).toBe('Hello world.');
});
```

运行测试用例

`Node/Basic` 目录下执行命令

```bash
jest helloworld --watch
```

![image-20210308110411409](https://gitee.com/tianle_ytl/drawing-bed/raw/master/assets/202101/image-20210308110411409.png)

## 测试代码生成工具

在 Basic 中新增 js 文件，可以自动生成测试用例

### 生成测试文件名

+ 掌握 fs 中的同步方法
+ path 包

`Node/testNow/index.js`

```javascript
const { basename, extname, dirname } = require('path');
const path = require('path');

module.exports = class TestNow {
  /**
   * 生成测试文件名
   * @param {*} filename 代码文件名
   * @returns
   */
  getTestFileName(filename) {
    const dirName = path.dirname(filename);
    const baseName = path.basename(filename);
    const extName = path.extname(filename);
    const testName = baseName.replace(extName, `.spec${extName}`);

    return path.format({
      root: dirName + '/__test__/',
      base: testName,
    });
  }
};
```

`Node/testNow/__test__/index.spec.js`

```javascript
test('测试文件名生成', () => {
  const src = new (require('../index'))();
  const ret = src.getTestFileName('/abc/class.js');
  console.log('getTestFileName -- ', ret);
  expect(ret).toBe('/abc/__test__/class.spec.js');
});
```

`Node/testNow` 路径下运行测试用例

```bash
jest testNow --watch
```

### 生成测试代码

`Node/testNow/index.js`

```javascript
const { basename, extname, dirname } = require('path');
const path = require('path');

module.exports = class TestNow {
  getTestSource(methodName, classFile, isClass = false) {
    console.log('getTestSource -- ', methodName);

    return `
test('${'TEST' + methodName}', () => {
  const ${isClass ? '{' + methodName + '}' : methodName} = require('${
      '../' + classFile
    }');
  const ret = ${methodName}();
  // expect(ret).toBe('Test ret');
})
    `;
  }

  /**
   * 生成测试文件名
   * @param {*} filename 代码文件名
   * @returns
   */
  getTestFileName(filename) {
    const dirName = path.dirname(filename);
    const baseName = path.basename(filename);
    const extName = path.extname(filename);
    const testName = baseName.replace(extName, `.spec${extName}`);

    return path.format({
      root: dirName + '/__test__/',
      base: testName,
    });
  }
};
```

`Node/testNow/__test__/index.spec.js`

```javascript
test('测试测试代码生成', () => {
  const src = new (require('../index'))();
  const ret = src.getTestSource('fun', 'class');
  console.log('ret -- ', ret);
  expect(ret).toBe(`
test('TESTfun', () => {
  const fun = require('../class');
  const ret = fun();
  // expect(ret).toBe('Test ret');
})
    `);
});

// test('测试文件名生成', () => {
//   const src = new (require('../index'))();
//   const ret = src.getTestFileName('/abc/class.js');
//   console.log('getTestFileName -- ', ret);
//   expect(ret).toBe('/abc/__test__/class.spec.js');
// });
```

`Node/testNow` 路径下运行测试用例

```bash
jest testNow --watch
```

### 生成 JEST 文件

`Node/testNow/__test__/data/class.spec.js`

```javascript
test('TESTfun01', () => {
  const {fun01} = require('../class.js');
  const ret = fun01();
  // expect(ret).toBe('Test ret');
})
    

test('TESTfun02', () => {
  const {fun02} = require('../class.js');
  const ret = fun02();
  // expect(ret).toBe('Test ret');
})  
```

`Node/testNow/__test__/data/fun.spec.js`

```javascript
test('TESTfun', () => {
  const fun = require('../fun.js');
  const ret = fun();
  // expect(ret).toBe('Test ret');
})
```

`Node/testNow/index.js`

```javascript
const { basename, extname, dirname } = require('path');
const path = require('path');
const fs = require('fs');

module.exports = class TestNow {
  genJestSource(sourcePath = path.resolve('./')) {
    const testPath = `${sourcePath}/__test__`;
    if (!fs.existsSync(testPath)) {
      fs.mkdirSync(testPath);
    }

    // 遍历代码文件
    let list = fs.readdirSync(sourcePath);
    list
      // 添加完整路径
      .map(v => `${sourcePath}/${v}`)
      // 过滤文件
      .filter(v => fs.statSync(v).isFile())
      // 排除测试代码
      .filter(v => v.indexOf('.spec') === -1)
      .map(v => this.genTestFile(v));
  }

  genTestFile(filename) {
    console.log('filename -- ', filename);
    const testFileName = this.getTestFileName(filename);

    // 判断此文件是否存在
    if (fs.existsSync(testFileName)) {
      console.log('该测试代码已存在', testFileName);
      return;
    }

    const mod = require(filename);
    let source;

    if (typeof mod === 'object') {
      source = Object.keys(mod)
        .map(v => this.getTestSource(v, path.basename(filename), true))
        .join('\n');
    } else if (typeof mod === 'function') {
      const basename = path.basename(filename);
      source = this.getTestSource(basename.replace('.js', ''), basename);
    }
    fs.writeFileSync(testFileName, source);
  }

  getTestSource(methodName, classFile, isClass = false) {
    console.log('getTestSource -- ', methodName);

    return `
test('${'TEST' + methodName}', () => {
  const ${isClass ? '{' + methodName + '}' : methodName} = require('${
      '../' + classFile
    }');
  const ret = ${methodName}();
  // expect(ret).toBe('Test ret');
})
    `;
  }

  /**
   * 生成测试文件名
   * @param {*} filename 代码文件名
   * @returns
   */
  getTestFileName(filename) {
    const dirName = path.dirname(filename);
    const baseName = path.basename(filename);
    const extName = path.extname(filename);
    const testName = baseName.replace(extName, `.spec${extName}`);

    return path.format({
      root: dirName + '/__test__/',
      base: testName,
    });
  }
};

```

`Node/testNow/__test__/index.spec.js`

```javascript
const fs = require('fs');
test('集成测试 测试生成测试代码文件', () => {
  // 准备环境
  // 删除测试文件夹
  fs.rmdirSync(__dirname + '/data/__test__', {
    recursive: true,
  });

  const src = new (require('../index'))();
  src.genJestSource(__dirname + '/data');
});
```

