import { Sum } from './sum';
import path = require('path');
import fs = require('fs');

export class Example {
  public myMethod = () => {
    console.log('hello world');

    console.log(path.delimiter);

    this.folderCheck();
  }

  public getSum = (a, b) => {
    return new Sum().sum(a, b);
  }

  private folderCheck = () => {
    if (fs.existsSync('./dist')) {
      console.log('dist detected');
    } else {
      console.log('no dist');
    }
  }
}
