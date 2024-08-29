---
layout: post
title:  "A Step Towards Modern CMake"
---

> 深入学习CMake就是精进工程能力的第一步！

#### 本教程参考的资料： 
+ （网课）小彭老师高性能C++系列课程 [course link](https://www.bilibili.com/video/BV1V84y117YU/?spm_id_from=333.788&vd_source=f0093d5807c733771228a4d4f410dc59)
+ （书籍）Modern CMake [link](https://cliutils.gitlab.io/modern-cmake/chapters/basics/variables.html)

## 1. CMake 的设计哲学

1. CMake is not a build system, it is a meta-build system (or
 "Cross-platform C++ build generator"). 

2. Think in modules, rather than thinking in implementations 
+ Forbid / report circular and hidden dependencies
+ Help developers reason at module level, not at build flags level 
+ Do more than build as you are told! 


## 2. 基础知识

+ 因为路径中可能包含空格，所以一定要用`"${MY_PATH}"`而不是单纯的`${MY_PATH}`!

### 3. 使用第三方库并构建更大的工程 


项目名/include/项目名.h 的组织方式

![image-20230704071049257](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704071049257.png)

好处是可以避免文件同名冲突


### 1.`target_include_directories`

使用target_include_directories，而不要用include_directories好处是只对需要使用这个directories的target去增加include路径，不会污染其他的target

使用public修饰符：为了让链接biology的pybmain也可以共享 根/biology/include这个头文件搜索路径



### 2.管理子项目`add_subdirectory`  



standard写在project前面



根项目的CMakeLists.txt负责处理全局有效的设定，而子项目的CMakeLists.txt仅考虑子项目自身的设定，比如他的头文件目录，要链接的库等。 



因为子项目的CMakeLists.txt里面指定的路径都是相对路径，所以指定src实际上是  根/biology/src



思想：实现全在库里，可执行文件只是入口



建议：全部统一采用`#include<项目名/模块名.h>`的形式 ("" 是找相对路径， <>是找cmakelist里面的规定的模块目录)

![image-20230704073352415](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704073352415.png)



### 3. `GLOB_RECURSE`

最好使用`file(GLOB_RECURSE myvar CONFIGURE_DEPENDs src/*.cpp)`

![image-20230704072415509](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704072415509.png)



在头文件里直接实现函数的时候，要加static或inline

inline有另一个作用，但不是内联？



### 4. 前向声明

因为指针都是8字节，所以编译器只需要知道该给这个Animal* 分配多少内存即可！

![image-20230704073039587](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704073039587.png)



### 5. 关于extern 

extern "C" 两个在一起是一个关键字



### 6. CMake也有include功能

通过include(xxx), cmake会在CMAKE_MODULE_PATH这个列表中的所有路径下查找XXX.cmake这个文件，然后我们就可以在XXX.cmake里面写一些自己常用的函数，如宏和变量等（小脚本）--> 和复制粘贴没有区别



`set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/cmake;${CMAKE_MODULE_PATH}")` 



`CMAKE_CURRENT_LIST_DIR`: cmakelists.txt当前所在的目录 



## chapter2 第三方库配置

### 1. `find_package`

![image-20230704074859855](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704074859855.png)

find_package(OpenCV)实际上是在找一个名为 OpenCVConfig.cmake的文件（包配置文件 ）

历史兼容性：OpenCV-config.cmake也行

正常情况下不指定的话，会把全部组件都包含进来

linux系统下默认的cmake文件路径`/usr/lib/cmake/XXX/XXXConfig.cmake`

![image-20230704075546233](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704075546233.png)

![image-20230704075844498](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704075844498.png)

![image-20230704080005588](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704080005588.png)

 executable, .a,.so 的不同路径

![image-20230704080512701](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704080512701.png)



如果第三方库没有主动为Cmake提供XXXConfig.cmake

则CMake可以通过FindXXX.cmake主动去适配第三方库



#### `find_package` 具体的用法

![image-20230704124448041](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704124448041.png)

### 符号隐藏



### 古代CMake和现代CMake

![image-20230704124308629](/Users/lizhehao/Library/Application Support/typora-user-images/image-20230704124308629.png)



