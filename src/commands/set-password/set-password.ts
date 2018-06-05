import chalk from 'chalk';
import { Command } from 'commander';
import { Database } from '../../app/controllers/databases/database';
import { appConfig } from '../../app/helpers/app-config';
import * as inquirer from 'inquirer';
import { Questions } from 'inquirer';

export interface ICommandSetPasswordAnswers {
  email: string;
  password: string;
}

export class CommandSetPassword {
  private questions: Questions = [
    {
      type: 'input',
      name: 'email',
      message: 'User email?',
    },
    {
      type: 'password',
      name: 'password',
      message: 'New password?',
    },
  ];

  // istanbul ignore next: This is not tested since it relies on CLI text
  constructor (program: Command) {
    program.command('set-password')
      .description('Set a user\'s password')
      .action(async () => {
        console.log(chalk.bold('Change a user\'s password'));
        await this.action();
      });
  }

  public async action () {
    return new Promise<void>(async (resolve) => {
      const answers: ICommandSetPasswordAnswers = await inquirer.prompt(this.questions) as any;

      const db = await this.connectToDatabase();

      const user = await db.models.User.findOne({ email: answers.email });
      if (user) {
        user.password = answers.password;

        try {
          await user.save();
        } catch (e) {
          console.error(chalk.red(e));
        }
        console.log(chalk.green(`User ${user.email} password changed`));
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
