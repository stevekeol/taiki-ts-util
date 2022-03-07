# taiki-ts-util
`Typescript`项目中可以用到的`语言特性层面`的工具

> taiki纯属人名，不具备特殊含义。

> 版本号： a.b.c中，b表示有新的特性加入，c表示无新特性的更新.

## Features
1. 依赖注入DI
```typescript
import { Inject, Injectable } from "taiki-ts-util"

@Injectable('user')
class User {
  
}
```