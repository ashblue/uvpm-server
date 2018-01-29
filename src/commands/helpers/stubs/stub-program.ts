import { Command } from 'commander';

export class StubProgram {
  public program = new Command();

  public runWith (argString: string) {
    this.program.parse(['node', './']
      .concat(argString.split(' ')));
  }
}
