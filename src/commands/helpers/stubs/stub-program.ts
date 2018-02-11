import { Command } from 'commander';

export class StubProgram {
  public program = new Command();

  // istanbul ignore next: Should never be run during tests, crashes the command
  public runWith (argString: string) {
    this.program.parse(['node', './']
      .concat(argString.split(' ')));
  }
}
