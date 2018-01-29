import { StubProgram } from '../helpers/stubs/stub-program';
import { CommandCollection } from './command-collection';
import { StubInquirer } from '../helpers/stubs/stub-inquirer';
import * as chai from 'chai';

const expect = chai.expect;

describe('CommandCollection', () => {
  let programStub: StubProgram;

  beforeEach(() => {
    programStub = new StubProgram();
  });

  it('should initialize', () => {
    const col = new CommandCollection(programStub.program, new StubInquirer() as any);
    expect(col).to.be.ok;
  });

  it('should create a new create-user command', () => {
    const col = new CommandCollection(programStub.program, new StubInquirer() as any);
    expect(col.cmdCreateUser).to.be.ok;
  });
});
