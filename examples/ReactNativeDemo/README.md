#### 创建项目
```
# 首先要安装nodejs
推荐高级用户使用node安装器安装
    Windows 下推荐 Nodist 
    OSX 下推荐 nvm

# 安装RN工具
set npm_config_registry=https://registry.npm.taobao.org
npm i -g react-native-cli

#查看版本号(目前使用的就是这个版本)
react-native -v
    react-native-cli: 1.0.0
    react-native: n/a - not inside a React Native project directory

#创建项目(本项目已不需要)
react-native init ReactNativeDemo

#安装flux (本项目已不需要) 安装完毕后应该修改下package.json 使用相对路径
npm i --save-dev ../../
"sav-flux": "../../",

```

#### 目录结构
```
.babelrc
.buckconfig
.flowconfig
.gitignore
.watchmanconfig
android
index.android.js
index.ios.js
ios
package.json
__tests__
node_modules
```

#### 安装依赖

```
npm install
```

### Widnows Android 配置

安装 Android Studio
安装 JDK

非必须
    修改 android/gradle/wrapper/gradle-wrapper.properties文件 因为gradle下载比较慢
        把
            distributionUrl=https\://services.gradle.org/distributions/gradle-2.4-all.zip
        换成已下载的地址
            distributionUrl=http\://192.168.0.205/android/gradle-2.4-all.zip

非必须 
    修正构建工具链
        打开AndroidSDK安装目录下的 SDK Manager文件
        检查或下载需要的Android SDK Build-tools 如安装 23.0.3版本
    修改文件 android/app/build.gradle
        将     buildToolsVersion "23.0.1"
        替换为 buildToolsVersion "23.0.3"

创建模拟器并启动

#### 运行程序
```
# 开启服务
npm start

# 发布
react-native run-android

```

### OSX IOS 环境

这个比较简单了

```
react-native run-ios
```
