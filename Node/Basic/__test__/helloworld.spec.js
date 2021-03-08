test('测试 Hello world', () => {
  const ret = require('../helloworld');
  console.log('helloworld -- ', ret);
  expect(ret).toBe('Hello world.');
});
