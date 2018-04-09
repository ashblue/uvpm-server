import { Command } from 'commander';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Questions } from 'inquirer';
import { CtrlUserRoles } from '../../app/controllers/user-roles/ctrl-user-roles';
import { Database } from '../../app/controllers/databases/database';
import { appConfig } from '../../app/helpers/app-config';

export interface ICommandUserRoleAnswers {
  email: string;
  role: string;
}

export class CommandUserRole {
  private questions: Questions = [
    {
      type: 'input',
      name: 'email',
      message: 'User email?',
    },
    {
      type: 'list',
      name: 'role',
      message: 'Change role to a?',
      choices: Object.keys(CtrlUserRoles.roles),
    },
  ];

  constructor (program: Command) {
    program.command('user-role')
      .description('Generate a new user')
      .action(async () => {
        console.log(chalk.bold('Change a user\'s role'));
        await this.action();
      });
  }

  public async action () {
    return new Promise<void>(async (resolve) => {
      const answers: ICommandUserRoleAnswers = await inquirer.prompt(this.questions) as any;

      const db = await this.connectToDatabase();

      const user = await db.models.User.findOne({ email: answers.email });
      if (user) {
        user.role = answers.role;
        await user.save();
        console.log(chalk.green(`User ${user.email} role changed to ${answers.role}`));
      } else {
        console.error(chalk.red(`User ${answers.email} could not be found`));
      }

      db.closeConnection(() => {
        this.exit();
        resolve();
      });
    });
  }

  private connectToDatabase (): Promise<Database> {
    return new Promise<Database>((resolve) => {
      const db = new Database(appConfig.dbUrl, () => {
        resolve(db);
      });
    });
  }

  // istanbul ignore next
  private exit () {
    if (appConfig.isEnvTest()) {
      return;
    }

    process.exit();
  }
}
