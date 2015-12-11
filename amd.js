/*********************************
  javascript asynchronous module definition
  Author: treemonster <https://www.xdelve.com>
  Latest: 2015-12-11
**********************************/
var define,require;
void function(){

// 配置文件
var config={};

// 已加载的模块缓存
var moduleCache={};

// 已定义但缺少依赖所以尚未加载的模块
var modulePending={};

// 正在下载的模块文件队列
var loadingList={};

// 依赖尚未加载完毕的模块列表
var moduleWaitList=[],requireWaitList=[];

// 已经加载过的js文件列表，如果此列表里存在，则执行define会报错。目的是限制setTimeout等非主流的模块定义方式。。
var isEnd={};

// 地址解析正则
var r=/(^https*\:\/\/[^\/]+)*([^\?]+)(\?.*?$)*/g;
// 判断是否某个类型
function is(a,b){
  return a===b || a && a.constructor===b;
}

// 转换相对路径到带域名的绝对路径
function format(src,refer){  
  var h=function(s){
    return s.replace(r,function(a,b){return b?b:''}).length;
  };
  if(refer){
    if(src.match(/^\./))src=refer+src;
    else if(src.match(/^\./) && config.baseUrl===undefined)src=refer+src;
  }
  return src.replace(/(^\/)|^/,function(a,b){
    var xb=config.baseUrl||'';
    if(!b)return h(src)?'':xb+'/';
    var x=xb.replace(r,'$1');
    return (h(x)?x:'')+'/';
  }).replace(r,function($,host,path,args){
    if(!host)host=location.href.replace(r,'$1');
    for(var i=0,path=path.split('/');i<path.length;i++)
      if(path[i]==='..')
        path.splice(i-1,2),i-=2;
      else if(path[i]==='.' || 
        (path[i]==='' && i && i<path.length-1)
        )path.splice(i,1),i--;
    return host+('/'+path.join('/')+(args||'')).replace(/\/+/g,'/');
  });
}
// 格式化带域名的绝对路径到模块名
function formatAsModuleName(absUrl){
  return (absUrl||'').replace(/(\.js)(\?.*?)*$/g,'');
}
// 格式化模块名到模块路径
function toPath(moduleName){
  return moduleName.replace(/[^\/]+$/,'/').replace(/\/\/$/,'/');
}
function setImmediate(callback){
  var a=Array.prototype.slice.call(arguments,1);
  setTimeout(function(){
    callback.apply({},a);
  },0);
};
// 加载js失败回调
var resourceError=function(){};
// 运行时错误回调
var runtimeError=function(){};
// 异步加载js
function loadScript(src){
  src=format(src);
  if(loadingList[src])return;
  loadingList[src]=true;
  var script=document.createElement('script');
  var head=document.getElementsByTagName('head')[0];
  var moduleName=formatAsModuleName(src);
  script.loaded=false;
  function load(){
    if(script.loaded)return;
    script.loaded=true;
    kill();
    setImmediate(function(){
      isEnd[src]=true;
    },src);
  }
  function kill(d){
    t(function(){
      head.removeChild(script);
      d && resourceError({
        src: script.src,
        moduleName: moduleName
      });
    });
  }
  script.onerror=function(){
    kill(true);
  };
  script.onreadystatechange=function(){
    /loaded|complete/.test(this.readyState) && load();
  };
  script.onload=load;
  script.type='text/javascript';
  script.async="async";
  script.defer="defer";

  src=src.replace(r,function(a,host,path,args){
    path=path||'';
    if(!path.match(/^[^?]*?\.js$/))path+='.js';
    return (host||'')+path+(args||'').replace(/\?|$/,function(a){
      return config.version===undefined?a:((a?a:'?')+config.versionkey+'='+config.version+(args?'&':''));
    });
  });
  script.src=src;
  // 否则使用定时器等待head出现之后再添加节点
  if(head)head.insertBefore(script,head.firstChild);
  else throw 'no HEAD matches';
  return script;
}
// module转成exports
var toExports=function(modules){
  for(var i=0;i<modules.length;i++)
    modules[i]=modules[i].exports;
  return modules;
};

// require('a/') 等价于 require('a/index')
// define('a/') 等价于 define('a/index')
var updateIndex=function(id){
  return id?id.replace(/\/($|\?.*$)/,'/index$1'):id;
};

// define
/**************
define(id?,dependencies?,factory);
id即模块名，缺省等于moduleName。id可以是完整路径，也可以是相对路径，format函数会自行格式化。
dependencies为这个模块所依赖的模块名，如果使用相对路径，则模块加载器会以id为起始路径在加载的缓存中进行搜索，如果缓存不存在，则发起网络请求。
factory为一个方法，或者object，表示对外接口
***************/
var _define=function(){
  var a=arguments;
  var id,dependencies=[],factory,script=this;
  for(var i=0,len=a.length;i<len-(len>3);i++)switch(true){
    case is(a[i],String):
      id=a[i];break;
    case is(a[i],Array):
      dependencies=a[i];break;
    case is(a[i],Function):
      factory=a[i];break;
    case is(a[i],Object):
      (function(f){
        factory=function(){return f;};
      })(a[i]);break;
    default: throw ['Unknown arguments of define',a];
  }
  id=updateIndex(id?format(id,toPath(script.moduleName)):script.moduleName);
  if(id!==undefined)modulePending[id]=true;
  if(allReady(dependencies,id+'/../')===null)
    return moduleWaitList.push([id,dependencies,factory,script]);
  var module={exports:{}};
  if(id!==undefined){
    moduleCache[id]=module;
    delete modulePending[id];
  }
  var require=function(moduleName,callback){
    var one=is(moduleName,String);
    if(one)moduleName=[moduleName];
    for(var i=0;i<moduleName.length;i++)
      moduleName[i]=updateIndex(moduleName[i]);
    var ready=allReady(moduleName,id && toPath(id));
    if(one && !ready)throw new Error('Module name "'+moduleName+'" has not been loaded yet for context: _. Use require([],function(){})');
    if(ready===null)
      return 0&requireWaitList.push([moduleName,id && toPath(id),callback]);
    toExports(ready);
    callback && callback.apply({},ready);
    if(one)return ready[0];
    // return one?ready[0]:ready;
  };require.toUrl=function(str){
    return format('./'+str||'',id && toPath(id));
  };
  var e;
  t(function(){
    if(e=factory(require,module.exports,moduleCache[id]))
      moduleCache[id]={exports:e};
  });

  // 清除等待中的队列
  setImmediate(function(){
    for(var i=moduleWaitList.length;i--;){
      var f=moduleWaitList[i];
      moduleWaitList.splice(i,1);
      _define.apply(f[3],f.splice(0,3));
    }
    for(var i=requireWaitList.length;i--;){
      var callback=requireWaitList[i][2];
      var modules=allReady(requireWaitList[i][0],requireWaitList[i][1]);
      if(modules===null)continue;
      requireWaitList.splice(i,1);
      t(function(){
        callback && callback.apply(this,toExports(modules));
      });
    }
  });
  return e;
};
// 获取当前执行的脚本
function getCurrentScript(){
  // 现代浏览器
  if(document.currentScript)return document.currentScript.src;
  // ie6-9
  if(document.createElement('script').onreadystatechange===null)
    return (function(s){
      for(var i=s.length;i--;)
        if(s[i].readyState==="interactive")
          return s[i].src;
    })(document.getElementsByTagName("script"));
  // ie11
  try{null()}catch(e){
    try{
      return e.stack.match(/https*\:\/\/.+?\.js\S*?(?=[\:\s])/g).pop();
    }catch(e){
      // 历史版本的safari，等。。。
      throw '对不起，您的浏览器版本太老，本网站不支持';
      document.body.style.display='none';
    }
  }
}
define=function(){
  var a=arguments;
  var moduleName=formatAsModuleName(getCurrentScript());
  // 兼容直接定义的模块
  if(a[0]+''===a[0])
    loadingList[format(a[0])]=true;
  return _define.apply({
    moduleName: moduleName, // a/b/c.js -> a/b/c
    path: toPath(moduleName) // a/b/c.js -> a/b/
  },a);
};
define.amd=true;
// 通过路径或者config.paths的别名获取module
function getModule(name,path){
  var r=function(name){return name.replace(/\?.*$/,'');};
  // 如果paths里配置了别名路径，则优先使用别名
  var module_alias=format(config.paths[r(name)]||name,path);
  var module=moduleCache[formatAsModuleName(r(module_alias))]||
      moduleCache[formatAsModuleName(format(r(name),path))];
  return [module,updateIndex(module_alias)];
};
function allReady(dependencies,path){
  path=path||'';
  var result=[],ready=true;
  for(var i=dependencies.length;i--;){
    var q=getModule(dependencies[i],path),
        module=q[0],
        module_alias=q[1];
    if(module===undefined){
      config.paths[dependencies[i]]=module_alias;

      // 保证同步定义的模块不会被顺序影响
      setImmediate(function(d,p){
        var module=getModule(d,p);
        if(!module[0] && !modulePending[module[1].replace(/\?.*/,'')])
          loadScript(module[1]);
      },dependencies[i],path);

      ready=false;
    }else result.unshift(module);
  }
  return ready?result:null;
}
function t(f){
  try{
    return f();
  }catch(e){
    setImmediate(function(){
      if(runtimeError(e)!==true)
        throw e;
    });
  }
}

require=function(){
  var a=arguments;
  _define.apply({},[function(require){
    require.apply(this,a);
  }]);
  if(is(a[0],String))
    return (getModule(a[0])[0]||{}).exports;
};
require.config=function(obj){
  if(obj.r_paths){
    obj.paths=obj.paths||{};
    var r_paths=obj.r_paths;
    for(var p in r_paths)
      for(var i=0;i<r_paths[p].length;i++)
        obj.paths[r_paths[p][i]]=p.replace(/\*/g,r_paths[p][i]);
    delete obj.r_paths;
  }
  for(var k in obj)config[k]=obj[k];
};
require.resourceError=function(handler){
  resourceError=handler;
};
require.runtimeError=function(handler){
  runtimeError=handler;
};
require.moduleCache=moduleCache;
require.config({
  baseUrl:location.href.replace(/[^\/]*$/,''),
  paths:{},
  versionkey:'_'
});
}();

