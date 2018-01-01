import { Example } from './example';
import fs = require('fs');

describe('Example', () => {
  it('should add 2 + 2', () => {
    const num1 = 2;
    const num2 = 2;
    const ex = new Example();

    expect(ex.getSum(num1, num2)).toEqual(num1 + num2);
  });

  it('should create folder', () => {
    if (!fs.existsSync('./dist')) {
      fs.mkdirSync('./dist');
      fs.writeFileSync('./dist/bundle.js', '');
    }
  });
});
