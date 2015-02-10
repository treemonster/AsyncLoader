/*********************************************************
Author: treemonster
Latest: 2015-2-10
Git: https://github.com/treemonster/AsyncLoader.js
*********************************************************/

window.AsyncLoader={};
var define;
(function(loader,isDebug){
	var loads=[],loaded={},module={},wait={},wi=0,callbackwait={};
	if(isDebug===true)loader.debug=[loads,loaded,module,wait,callbackwait];
	function is(a,b){return a!==undefined && a.constructor===b;}
	function format(request,refer){
		//format module path
		//if module "a/b/c" asks for "../d", that resolves to "a/d"
		//if module "a/b/c" asks for "./e", that resolves to "a/b/e"
		request=refer+request;
		var re=[];
		for(var i=0,req=request.split('/');i<req.length;i++)
			if(req[i]==='.')continue;
			else if(req[i]==='..')re.pop();
			else re.push(req[i]);
		return re.join('/');
	}
	function loadScript(src){
		var script=document.createElement('script');
		var head=document.getElementsByTagName('head')[0];
		//remove script element
		script.onerror=function(){try{head.removeChild(this);}catch(e){}};
		//in load event will be execute only once, start by script.onload or script.onreadystatechange
		var load=function(){
			if(this.loaded==true)return;
			this.loaded=true;
			loads.push(this);
			this.onerror();
		};
		if(script.onreadystatechange===null)
			script.onreadystatechange=function(){if(/loaded|complete/.test(this.readyState))load.call(this);};
		else script.onload=load;
		script.type='text/javascript';
		script.async="async";script.defer="defer";
		//moduleName is a relative script pathname, but not has extension name
		script.src=(script.moduleName=src.replace(/\.js(\?.*)*$/i,''))+'.js';
		if(head)head.insertBefore(script,head.firstChild);
	}
	function test(requires,refer){
		//test if all require modules are ready
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
		//ready will return null if some require modules are not ready
		return [requires,ready];
	}
	define=function(){
		//define(id?, dependencies?, factory);
		var a=arguments;
		//`setTimeout(,0)` is used to compatible the safari. safari has no way to get the currentscript pathname
		if(this.ready!=true)return setTimeout(function(){
			define.apply({ready:true,node:loads.shift()},a);
		},0);
		//fill the necessary attributions
		if(this.moduleName===undefined){
			this.moduleName=this.node.moduleName;
			this.path=this.moduleName.replace(/[^\/]+$/,'');
			delete this.node;
		}
		var id,dependencies,factory,l=a.length,node=this,tested=node.tested||a[3];
		//define has three overloads
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
		//if required modules are not absolute path, complete them
		if(tested===undefined){
			if(id)id=format(node.path+id,'./');
			else id=format(node.moduleName,'./');
			tested=test(dependencies,node.path);
			if(loaded[id])return;
			loaded[id]=true;
			node.moduleName=id;
		}if(tested[1]===null){
			//if some required modules are not ready, join this module into wait queue
			wait[wi++]=[id,dependencies,factory,node];
			return;
		}
		var w,m={exports:(module[id]={})};
		//require has two overloads
		//require('xx')
		//It MUST throw an error if the module has not already been loaded and evaluated. In particular, the synchronous call to require MUST NOT try to dynamically fetch the module if it is not already loaded, but throw an error instead.
		//require(['xx','yy'],function(xx,yy){...})
		//The Array is an array of String module IDs. The modules that are represented by the module IDs should be retrieved and once all the modules for those module IDs are available, the Function callback is called, passing the modules in the same order as the their IDs in the Array argument.
		var getRequire=function(moduleName,callback){
			var one=is(moduleName,String);
			if(one)moduleName=[moduleName];
			var t=test(moduleName,node.path);
			if(callback){
				//if required modules not all ready, join the callback into callbackwait queue
				if(t[1]!==null)callback.apply(node,t[1]);
				else callbackwait[wi++]=[callback,t[0],node];
			}else return one?t[1][0]:t[1];
		};
		//Converts a String that is of the form [module ID] + '.extension' to an URL path. require.toUrl resolves the module ID part of the string using its normal module ID-to-path resolution rules, except it does not resolve to a path with a ".js" extension. Then, the '.extension' part is then added to that resolved path. 
		getRequire.toUrl=function(str){
			return format(str,node.path);
		};
		//factory can be a function or an object
		if(is(factory,Object))module[id]=factory;
		else factory(getRequire,m.exports,m);
		//resolve the callbackwait queue
		for(var i in callbackwait){
			var t=test(callbackwait[i][1]);
			if(t[1]!==null){
				var cb=callbackwait[i].slice(0);
				delete callbackwait[i];
				cb[0] && cb[0].apply(cb[2],t[1]);
			}
		}
		//resolve the wait queue
		for(var i in wait){
			if(test(wait[i][1])[1]===null)continue;
			w=wait[i].slice(0);
			delete wait[i];
			define.apply(w[3],w);
		}
	};
	define.amd={};
	//load main module
	loader.use=function(src){loadScript(src)};
})(AsyncLoader,false);
