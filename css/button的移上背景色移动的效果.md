# button的移上背景色移动的效果

vue:
```
<template>
  <div id="citylist">
    <h1>button的移上背景色移动的效果</h1>
    <a class="donghua" href='#'>
        <span>登陆</span>
    </a>
  </div>
</template>
<script>
export default {
  name: "citylist",
  data: () => ({

 }),
 methods: {

 }
}
</script>
<style lang="scss" scoped>
.donghua{
  position: relative;
  display: block;
  color: #1c1b1b;
  width: 320px;
  height: 80px;
  line-height: 80px;
  text-align: center;
  // background:transparent;
  margin: 0 auto;
  border: 1px solid #000;
  cursor: pointer;
  // box-shadow: inset 0 0 0 0 #e6e6e6;
  // opacity: 1;
}
.donghua:hover{
  color: #fff;
}
.donghua:hover::after{
  transform: scaleX(1);
}
.donghua:hover::before{
  transform: scaleX(1);
}
.donghua::after{
  background-color: #000;
  content:'';
  position: absolute;
  top: 0px;
  right: 0px;
  width: 50%;
  height: 100%;
  transition: transform 0.5s linear;
  transform: scaleX(0);
  transform-origin: left center;
}
.donghua::before{
  content:'';
  position: absolute;
  top: 0px;
  left: 0px;
  width: 50%;
  height: 100%;
  transition: transform 0.5s linear;
  transform: scaleX(0);
  transform-origin: right center;
  background-color: #000;
}
.donghua span{
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

</style>
```
知识要点，div仿button,里边的文字一定要用一个元素包裹如span。利用伪元素，制作背景移动的效果。```transform: scaleX(0);```这个属性的值为0时，伪元素不显示。为1时```transform: scaleX(1);```正常显示，根据这个属性制作动画效果。
<video src='./img/button.mp4' width='320' height='300' controls></video>
