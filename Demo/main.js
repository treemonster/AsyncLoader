define([
  'requires/s/3/f/modules/normalDefine',
  'requires/s/1/f/modules/simpleDefine',
  'requires/modules/other/toUrl'],
function(require){
  //require 方法接受两种使用方式
  //第一种是同步返回，但是如果没有在define参数中定义过，直接调用会发生错误
  //第二种是异步加载，这种使用方式的返回值是undefined。但是可以直接加载需要的模块（不需要在define的参数中定义），并用回调函数来使用这些模块
  //回调函数的参数的次序为模块的次序
  var toUrl=require('requires/modules/other/toUrl');
  toUrl.toUrl('./test.html');

  require([
  	 'requires/s/3/f/modules/normalDefine',
    'requires/s/1/f/modules/simpleDefine',
    'requires/modules/other/toUrl'],
  function(normalDefine,simpleDefine,toUrl){
      normalDefine.test('ok');
      simpleDefine.test('ok');
      toUrl.toUrl('test.html');
  });

});