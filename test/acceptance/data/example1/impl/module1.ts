import { TestInterface1, TestInterface2 } from '../core/module1';

export class Test1 implements TestInterface1 {}

export class Test2 implements TestInterface2 {
  answer = 42;
}
