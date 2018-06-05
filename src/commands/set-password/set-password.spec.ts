import * as commander from 'commander';
import { Questions } from 'inquirer';
import { App } from '../../app/app';
import { Database } from '../../app/controllers/databases/database';
import { CommandSetPassword, ICommandSetPasswordAnswers } from './set-password';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as inquirer from 'inquirer';
import { SinonStub } from 'sinon';
import { IModelUser } from '../../app/models/user/i-model-user';
import chalk from 'chalk';

describe('CommandSetPassword', () => {
  let app: App;
  let db: Database;
  let cmd: CommandSetPassword;

  // Clear the database
  beforeEach((done) => {
    cmd = new CommandSetPassword(new commander.Command());

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

  describe('npm run set-password', () => {
    let answers: ICommandSetPasswordAnswers;
    let user: IModelUser;
    let stubConsoleLog: SinonStub;
    let stubConsoleError: SinonStub;
    let stubInquirerPrompt: SinonStub;

    beforeEach(() => {
      stubConsoleLog = sinon.stub(console, 'log');
      stubConsoleError = sinon.stub(console, 'error');

      answers = {
        email: 'asdf@asdf.com',
        password: 'newPassword1',
      };

      stubInquirerPrompt = sinon.stub(inquirer, 'prompt');
      stubInquirerPrompt.callsFake(() => {
        return new Promise<ICommandSetPasswordAnswers>((resolve) => {
          resolve(answers);
        });
      });
    });

    beforeEach(async () => {
      user = new app.db.models.User({
        name: 'asdf',
        email: 'asdf@asdf.com',
        password: 'asdfasdf1',
        role: 'subscriber',
      });

      await user.save();
    });

    afterEach(() => {
      stubConsoleLog.restore();
      stubConsoleError.restore();
      stubInquirerPrompt.restore();
    });

    it('should ask for the username, password, password confirm', async () => {
      const questions: Questions = [
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

      await cmd.action();

      expect(stubInquirerPrompt.calledWith(questions)).to.be.ok;
    });

    it('should change the user\'s password', async () => {
      await cmd.action();
      const userUpdated = await app.db.models.User.findById(user.id) as IModelUser;

      expect(userUpdated.password).to.eq(answers.password);
    });

    it('should return an error if the password is invalid', async () => {
      stubInquirerPrompt.callsFake(() => {
        return new Promise<ICommandSetPasswordAnswers>((resolve) => {
          resolve({
            email: 'asdf@asdf.com',
            password: 'pass',
          });
        });
      });

      await cmd.action();

      const errorLog = stubConsoleError.getCall(0).args[0];

      expect(errorLog).to.contain('Password must be at least 8 characters');
    });

    it('should fail if a user cannot be found', async () => {
      answers.email = 'kdjfkdj@fjkd.com';

      await cmd.action();

      expect(stubConsoleError.calledWith(chalk.red('User kdjfkdj@fjkd.com could not be found')))
        .to.be.ok;
    });
  });
});
