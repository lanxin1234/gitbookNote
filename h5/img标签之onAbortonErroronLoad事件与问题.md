## HTML img标签之onAbort、onError、onLoad事件与问题(转载)

转载链接： http://rain-2372.iteye.com/blog/1132504

img标签在使用的时候 一下几个事件非常的有用：

onError：当图片加载出现错误，会触发 经常在这里事件里头写入 将图片导向默认报错图片，以免页面上出现红色的叉叉

onLoad：事件是当图片加载完成之后触发

onAbort：图片加载的时候，用户通过点击停止加载（浏览器上的红色叉叉）时出发，通常在这里触发一个提示：“图片正在加载”



很好的利用这3个事件可以在HTML中实现很多图片的功能

例如：处理图片加载失败情况：<img src="image/1.jpg" width="258" height="178" onerror="this.src=''" />

IMG的onerror自动选择最快线路，根据服务器返回 错误：```
<img src="http://dianxin.xxx.com/NotExistsUrl" width="1" height="1"
   onerror="location.top.url='http://dianxin.xxx.com/'"/>
<img src="http://wangtong.xxx.com/NotExistsUrl" width="1" height="1"
   onerror="location.top.url='http://wangtong.xxx.com/'"/>```

例如，你可能会利用这个onAbort消息来警告用户，提醒他们停止某个重要图像的加载，例如图像映射：
   <img src="pics/camnpr.gif" usemap="#map1" onAbort="window.alert('注意:这张照片含有重要的链接,请重新载入.')">

同时有另一个问题出现：如果onerror="this.src='图片'"，这个"图片"也不存在时，就会出现下边的错误：
img图片没找到onerror事件 Stack overflow at line: 0


打开网页时提示 Stack overflow at line: 0。我做了截图如下：


经过分析，发现网页中存在类似如下的代码：

```<img src="pic.gif" onerror="javascript:this.src='/noPic.gif';" alt="pic" />```
分析：特别注意 onerror，当图片不存在时，将触发 onerror，而 onerror 中又为 img 指定一个 NoPic.gif 图片。也就是说图片存在则显示 pic.gif，图片不存在将显示

noPic.gif。但问题来了，如果 noPic.gif 也不存在，则继续触发 onerror，导致循环，故出现错误。

说明：如果图片存在，但网络很不通畅，也可能触发 onerror。

解决方法：第一种：：.去掉 onerror 代码；或者更改 onerror 代码为其它；或者确保 onerror 中的图片足够小，并且存在。

第二种：
```
<script type="text/javascript">  
<!--  
    function nofind(){  
        var img=event.srcElement;  
        img.src="../icon/default.gif";

img.onerror=null;       控制不要一直跳动

    }  
//没有找到时 用事件获取 一个一个获取  
//-->  
</script>  

<td align="center"><img src="../icon/${file.suffix }.gif" onerror="nofind();" />${file.name }</td>    
```
第三种:
使用两个<img />
```
<style type="text/css">
.hidden {
display: none;
}
</style>
<img src="camnpr.jpg" onerror="this.class='hidden';xx.class=''" />
<img src="camnpr.jpg" class="hidden" />```
