function serlize(url) {
  var result = {};
  //1、寻找？后面的字符串
  url = url.substr(url.indexOf("?") + 1);
  //2、将字符串用&分隔
  var args = url.split("&"); //[“a=1”,”b=2”]
  for (var i = 0, len = args.length; i < len; i++) {
    var arg = args[i];
    var item = arg.split('=');
    //3、对象的键=值
    result[item[0]] = item[1];
  }
  return result;
}
serlize('http://item.taobao.com/item.htm?a=1&b=2&c=&d=xxx&e');


function foo() {
  foo.a = function() {
    alert(1)
  };
  this.a = function() {
    alert(2)
  };
  a = function() {
    alert(3)
  };
  var a = function() {
    alert(4)
  };
};
foo.prototype.a = function() {
  alert(5)
};
foo.a = function() {
  alert(6)
};
foo.a(); //6
var obj = new foo();
obj.a(); //2
foo.a(); //1