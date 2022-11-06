import { TestClass1 } from '../core/module3';
import Test4 from './module2';

export class TestClass2 extends TestClass1 {
  readonly testClass2!: Test4;
}
