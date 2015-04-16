/*!
 * amd.js
 * Version: 1.1.1
 *
 * Copyright 2015 treemonster
 * Released under the Apache license
 * https://github.com/treemonster/AsyncLoader/blob/master/LICENSE
 */
var define,require;
// GLOBAL define should just use in module file
// GLOBAL require should just use in html page

!function(){
  var scriptLoaded={},wait={},uniqueId=0,callbackwait={},module={},defineQueue=undefined,requireQueue=undefined;
  function isTrue(a,b){
    if(a[b]===true)return true;else a[b]=true;
  }
  function is(a,b){
    return a===b || a && a.constructor===b;
  }
  function format(request,refer){
    var re=[];
    for(var i=0,req=(refer+request).split('/');i<req.length;i++)
      if(req[i]==='.')continue;
      else if(req[i]==='..' && re.length && re[re.length-1]!=='..')re.pop();
      else re.push(req[i]);
    return re.join('/');
  }
  function loadScript(src){
    if(isTrue(scriptLoaded,src))return;
    var script=document.createElement('script');
    var head=document.getElementsByTagName('head')[0];
    var moduleName=src.replace(/\.js(\?.*)*$/i,'');
    var loaded=false;
    var modules={};
    var kill=function(){try{head.removeChild(this);}catch(e){}};
    var load=function(){
      if(isTrue(this,'loaded'))return;
      if(defineQueue)for(var i=0;i<defineQueue.length;i++)
        _define.apply({
          moduleName: moduleName, // a/b/c.js -> a/b/c
          path: moduleName.replace(/[^\/]+$/,'') // a/b/c.js -> a/b/
        },defineQueue[i]);
      defineQueue=undefined;
      kill.call(this);
    };
    script.onerror=kill;
    if(script.onreadystatechange===null)
      script.onreadystatechange=function(){
        /loaded|complete/.test(this.readyState) && load.call(this);
      };
    else if(script.onload===null)script.onload=load;
    else throw 'Unknown Error';
    script.type='text/javascript';
    script.async="async";
    script.defer="defer";
    script.src=moduleName+'.js';
    if(head)head.insertBefore(script,head.firstChild);
  }
  function test(requires,refer){
    var ready=[];
    for(var i=0;i<requires.length;i++){
      if(refer!==undefined)requires[i]=format(requires[i],refer);
      if(module[requires[i]])ready!==null && ready.push(module[requires[i]]);
      else{
        loadScript(requires[i]);
        ready=null;
      }
    }
    return [requires,ready];
  }
  function cleanWait(waits){
    var isWait=waits===wait,result,cb,id;
    for(id in waits){
      result=test(waits[id][1]);
      if(result[1]===null)continue;
      cb=waits[id].slice(0);
      delete waits[id];
      if(isWait)_define.apply(cb[3],cb);
      else cb[0] && cb[0].apply(cb[2],toExports(result[1]));
    }
  }

  var toExports=function(modules){
    for(var i=0;i<modules.length;i++)modules[i]=modules[i].exports;
    return modules;
  };
  var _define=function(){
    var a=arguments;
    var id,dependencies=[],factory,node=this,tested=node.tested||a[3];
    for(var i=0,len=a.length;i<len-(len>3);i++){
      if(is(a[i],String))id=a[i];
      else if(is(a[i],Array))dependencies=a[i];
      else if(is(a[i],Function))factory=a[i];
      else factory={exports:a[i]};
    }
    if(tested===undefined){
      if(id)id=format(node.path+id,'./');
      else id=format(node.moduleName,'./');
      tested=test(dependencies,node.path);
      node.moduleName=id;
    }if(tested[1]===null){
      wait[uniqueId++]=[id,dependencies,factory,node];
      return;
    }
    var _module=module[id]={exports:{}};
    var _require=function(moduleName,callback){
      var one=is(moduleName,String);
      if(one)moduleName=[moduleName];
      var t=test(moduleName,node.path);
      if(t[1]!==null)toExports(t[1]);
      if(!callback)return one?(t[1]?t[1][0]:null):t[1];
      else t[1]?callback.apply(node,t[1]):(callbackwait[uniqueId++]=[callback,t[0],node]);
    };
    _require.toUrl=function(str){
      return format(str,node.path);
    };
    if(is(factory,Object))module[id]=factory;
    else factory(_require,_module.exports,module[id]);
    cleanWait(callbackwait);
    cleanWait(wait);
  };
  define=function(){
    var a=arguments;
    if(defineQueue===undefined)defineQueue=[];
    defineQueue.push(a);
  };
  define.amd=true;
  require=function(){
    var a=arguments;
    _define.apply({},[function(require){
      require.apply(this,a);
    }]);
  };
}();
