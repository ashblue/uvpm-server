import { Sum } from './sum';

export class Example {
  public myMethod = () => {
    console.log('hello world');
  }

  public getSum = (a, b) => {
    return new Sum().sum(a, b);
  }
}
