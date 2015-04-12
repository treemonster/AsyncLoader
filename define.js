/*********************************************************
Author: treemonster
Latest: 2015-2-10
Git: https://github.com/treemonster/AsyncLoader
*********************************************************/

var define=function(){
  var loads=[],loaded={},module={},wait={},wi=0,callbackwait={};
  function is(a,b){return a!==undefined && a.constructor===b;}
  function format(request,refer){
    var re=[];
    for(var i=0,req=(refer+request).split('/');i<req.length;i++)
      if(req[i]==='.')continue;
      else if(req[i]==='..')re.pop();
      else re.push(req[i]);
    return re.join('/');
  }
  function loadScript(src){
    var script=document.createElement('script');
    var head=document.getElementsByTagName('head')[0];
    script.onerror=function(){try{head.removeChild(this);}catch(e){}};
    var load=function(){
      if(this.loaded===true)return;
      this.loaded=true;
      loads.push(this);
      this.onerror();
    };
    if(script.onreadystatechange===null)
      script.onreadystatechange=function(){if(/loaded|complete/.test(this.readyState))load.call(this);};
    else script.onload=load;
    script.type='text/javascript';
    script.async="async";script.defer="defer";
    script.src=(script.moduleName=src.replace(/\.js(\?.*)*$/i,''))+'.js';
    if(head)head.insertBefore(script,head.firstChild);
  }
  function test(requires,refer){
    var ready=[];
    for(var i=0;i<requires.length;i++){
      if(refer!==undefined)requires[i]=format(requires[i],refer);
      if(module[requires[i]]){
        if(ready!==null)ready.push(module[requires[i]]);
      }else{
        loadScript(requires[i]);
        ready=null;
      }
    }
    return [requires,ready];
  }
  var define=function(){
    var a=arguments;
    if(this.ready!=true)return setTimeout(function(){
      define.apply({ready:true,node:loads.shift()},a);
    },0);
    if(this.moduleName===undefined){
      this.moduleName=this.node?this.node.moduleName:'';
      this.path=this.moduleName.replace(/[^\/]+$/,'');
      delete this.node;
    }
    var id,dependencies,factory,l=a.length,node=this,tested=node.tested||a[3];
    switch(l-(l>3)){
      case 3:
        id=a[0],dependencies=a[1],factory=a[2];
        break;
      case 2:
        if(is(a[0],String))id=a[0],dependencies=[],factory=a[1];
        else id=undefined,dependencies=a[0],factory=a[1];
        break;
      case 1:
        id=undefined,dependencies=[],factory=a[0];
        break;
    }
    if(tested===undefined){
      if(id)id=format(node.path+id,'./');
      else id=format(node.moduleName,'./');
      tested=test(dependencies,node.path);
      if(loaded[id])return;
      loaded[id]=true;
      node.moduleName=id;
    }if(tested[1]===null){
      wait[wi++]=[id,dependencies,factory,node];
      return;
    }
    var w,m={exports:(module[id]={})};
    var require=function(moduleName,callback){
      var one=is(moduleName,String);
      if(one)moduleName=[moduleName];
      var t=test(moduleName,node.path);
      if(callback){
        if(t[1]!==null)callback.apply(node,t[1]);
        else callbackwait[wi++]=[callback,t[0],node];
      }else return one?t[1][0]:t[1];
    };
    require.toUrl=function(str){
      return format(str,node.path);
    };
    if(is(factory,Object))module[id]=factory;
    else factory(require,m.exports,m);
    for(var i in callbackwait){
      var t=test(callbackwait[i][1]);
      if(t[1]!==null){
        var cb=callbackwait[i].slice(0);
        delete callbackwait[i];
        cb[0] && cb[0].apply(cb[2],t[1]);
      }
    }
    for(var i in wait){
      if(test(wait[i][1])[1]===null)continue;
      w=wait[i].slice(0);
      delete wait[i];
      define.apply(w[3],w);
    }
  };
  define.amd={};
  define.use=function(src){loadScript(src)};
  return define;
}();
