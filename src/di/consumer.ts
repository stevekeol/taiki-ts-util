import { Inject, Injectable } from './di'

@Injectable('timeService')
export class TimeService {
  // 1.类不一定都要有构造函数；当需要维护内部属性时才需要
  // 2.TS有类型声明Date
  public getCurrentDate(): Date {
    return new Date(Date.now())
  }
}

@Injectable('consumer')
export class Consumer {

  @Inject('timeService')
  private timeService : TimeService

  public currentDate: string;

  // currentDate属性是不需要从外界传入的，因此不放在构造函数中
  // 注意：这里有一种创建类的思想——不从外界显式的传入用于初始化的参数，而是内部固定的引入初始化对象
  constructor() {
    this.currentDate = this.timeService.getCurrentDate().toISOString();
  }
}

