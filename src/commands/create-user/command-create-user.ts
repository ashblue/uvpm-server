import { CtrlUser } from '../../app/controllers/users/ctrl-user';
import { Database } from '../../app/controllers/databases/database';
import { appConfig } from '../../app/helpers/app-config';
import { IUserData } from '../../app/models/user/i-user-data';
import { IModelUser } from '../../app/models/user/i-model-user';
import chalk from 'chalk';
import { Command } from 'commander';
import { Inquirer, Questions } from 'inquirer';

/**
 * @TODO Move to a base class to make re-usable
 */
export class CommandCreateUser {
  private questions: Questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Name?',
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email?',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password (min 8 characters, at least 1 number and letter)',
    },
  ];

  constructor (program: Command, private inquirer: Inquirer) {
    program
      .command('create-user')
      .description('Generate a new user')
      .action(() => {
        this.log(chalk.bold('Create a user'));
        this.action();
      });
  }

  public action (): Promise<IModelUser> {
    return new Promise<IModelUser>((resolve, reject) => {
      this.inquirer.prompt(this.questions)
        .then((answers) => {
          this.log(chalk.yellow('Creating user...'));
          return this.generateUser(answers as IUserData);
        })
        .then((user) => {
          this.log(chalk.green(`User created successfully`));
          this.log(`Name: ${user.name}`);
          this.log(`Email: ${user.email}`);

          resolve();
          this.exit();
        })
        .catch((err) => {
          this.logErr(chalk.red('Failed to create user'));
          this.logErr('Error Log:');

          if (appConfig.isEnvTest()) {
            this.logErr(err);
          } else {
            this.logErr('Could not generate a new user');
          }

          reject(err);
          this.exit();
        });
    });
  }

  private logErr (text: string) {
    if (appConfig.isEnvTest()) {
      return;
    }

    console.error(text);
  }

  private log (text: string) {
    if (appConfig.isEnvTest()) {
      return;
    }

    console.log(text);
  }

  private exit () {
    if (appConfig.isEnvTest()) {
      return;
    }

    process.exit();
  }

  private generateUser (user: IUserData): Promise<IModelUser> {
    return new Promise<IModelUser>((resolve, reject) => {
      const db = new Database(appConfig.dbUrl, () => {
        const ctrlUser = new CtrlUser(db);
        ctrlUser.register(user)
          .then(resolve)
          .catch(reject);
      });
    });
  }
}
