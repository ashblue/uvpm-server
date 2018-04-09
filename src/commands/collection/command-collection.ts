import { CommandCreateUser } from '../create-user/command-create-user';
import { Command } from 'commander';
import { Inquirer } from 'inquirer';
import { CommandUserRole } from '../user-role/command-user-role';

export class CommandCollection {
  public cmdCreateUser: CommandCreateUser;
  public cmdUserRole: CommandUserRole;

  constructor (private program: Command, inquirer: Inquirer) {
    this.setCliDetails();
    this.cmdCreateUser = new CommandCreateUser(program, inquirer);
    this.cmdUserRole = new CommandUserRole(program);
  }

  // istanbul ignore next: Should never run in test mode (crashes tests)
  public listen () {
    this.program.parse(process.argv);
  }

  private setCliDetails () {
    this.program
      .version('0.0.0')
      .description('UV Package Manager commands to interact with the server');
  }
}
