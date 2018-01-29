import { CommandCreateUser } from '../create-user/command-create-user';
import { Command } from 'commander';
import { Inquirer } from 'inquirer';

export class CommandCollection {
  public cmdCreateUser: CommandCreateUser;

  constructor (private program: Command, inquirer: Inquirer) {
    this.setCliDetails();
    this.cmdCreateUser = new CommandCreateUser(program, inquirer);
  }

  public listen () {
    this.program.parse(process.argv);
  }

  private setCliDetails () {
    this.program
      .version('0.0.0')
      .description('UV Package Manager commands to interact with the server');
  }
}
