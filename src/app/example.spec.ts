import { Example } from './example';

describe('Example', () => {
    it('should add 2 + 2', () => {
        const num1 = 2;
        const num2 = 2;
        const ex = new Example();

        expect(ex.getSum(num1, num2)).toEqual(num1 + num2);
    });
});
