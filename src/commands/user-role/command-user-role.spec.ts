import * as commander from 'commander';
import { CommandUserRole, ICommandUserRoleAnswers } from './command-user-role';
import * as sinon from 'sinon';
import * as inquirer from 'inquirer';
import { expect } from 'chai';
import { Questions } from 'inquirer';
import { CtrlUserRoles } from '../../app/controllers/user-roles/ctrl-user-roles';
import { App } from '../../app/app';
import { Database } from '../../app/controllers/databases/database';
import { RoleType } from '../../app/controllers/user-roles/roles/e-role-type';
import { IModelUser } from '../../app/models/user/i-model-user';
import { SinonStub } from 'sinon';
import chalk from 'chalk';

describe('CommandUserRole', () => {
  let app: App;
  let db: Database;
  let cmd: CommandUserRole;

  // Clear the database
  beforeEach((done) => {
    cmd = new CommandUserRole(new commander.Command());

    app = new App();
    app.db.connection.once('connected', () => {
      db = app.db;
      db.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  afterEach((done) => {
    app.db.closeConnection(done);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('npm run user-role', () => {
    let answers: ICommandUserRoleAnswers;
    let stubInquirerPrompt: SinonStub;

    beforeEach(() => {
      answers = {
        email: 'asdf@asdf.com',
        role: 'admin',
      };

      stubInquirerPrompt = sinon.stub(inquirer, 'prompt');
      stubInquirerPrompt.callsFake(() => {
        return new Promise<ICommandUserRoleAnswers>((resolve) => {
          resolve(answers);
        });
      });
    });

    afterEach(() => {
      stubInquirerPrompt.restore();
    });

    it('should ask what user and what role', async () => {
      const stubConsoleLog = sinon.stub(console, 'log');
      const questions: Questions = [
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

      const user = new app.db.models.User({
        name: 'asdf',
        email: 'asdf@asdf.com',
        password: 'asdfasdf1',
        role: 'subscriber',
      });

      await user.save();
      await cmd.action();

      stubConsoleLog.restore();

      expect(stubInquirerPrompt.calledWith(questions)).to.be.ok;
    });

    it('should set the new role on the user', async () => {
      const stubConsoleLog = sinon.stub(console, 'log');
      const user = new app.db.models.User({
        name: 'asdf',
        email: 'asdf@asdf.com',
        password: 'asdfasdf1',
        role: 'subscriber',
      });

      await user.save();
      await cmd.action();

      const userUpdated = await app.db.models.User.findById(user.id) as IModelUser;

      stubConsoleLog.restore();

      expect(userUpdated.role).to.eq(RoleType.Admin);
    });

    it('should fail if a user cannot be found', async () => {
      const stubConsoleError = sinon.stub(console, 'error');

      await cmd.action();

      stubConsoleError.restore();

      expect(stubConsoleError.calledWith(chalk.red('User asdf@asdf.com could not be found')))
        .to.be.ok;
    });
  });
});
