define([
  'requires/s/3/f/modules/normalDefine',
  'requires/s/1/f/modules/simpleDefine',
  'requires/modules/other/toUrl'],
function(require){

  // require.toUrl
  var toUrl=require('requires/modules/other/toUrl');
  toUrl.toUrl('./test.html');

  // require callback
  require([
  	 'requires/s/3/f/modules/normalDefine',
    'requires/s/1/f/modules/simpleDefine',
    'requires/modules/other/toUrl'],
  function(normalDefine,simpleDefine,toUrl){
      normalDefine.test('ok');
      simpleDefine.test('ok');
      toUrl.toUrl('test.html');
  });

  // require immediately
  require('requires/s/1/f/modules/simpleDefine').test(' immediately ok');

});