import { CommandCreateUser } from './command-create-user';
import * as chai from 'chai';
import { StubProgram } from '../helpers/stubs/stub-program';
import { StubInquirer } from '../helpers/stubs/stub-inquirer';
import { Answers } from 'inquirer';
import { App } from '../../app/app';
import { Database } from '../../app/controllers/databases/database';

const expect = chai.expect;

describe('CommandCreateUser', () => {
  let app: App;
  let db: Database;

  let programStub: StubProgram;

  // Clear the database
  beforeEach((done) => {
    app = new App();
    app.db.connection.once('connected', () => {
      db = app.db;
      db.connection.db.dropDatabase().then(() => {
        done();
      });
    });
  });

  beforeEach(() => {
    programStub = new StubProgram();
  });

  afterEach((done) => {
    app.db.closeConnection(done);
  });

  it('should initialize', () => {
    const createUser = new CommandCreateUser(programStub.program, new StubInquirer() as any);
    expect(createUser).to.be.ok;
  });

  it('should not have any database entries', async () => {
    const users = await db.models.User.find({});
    expect(users.length).to.eq(0);
  });

  it('should create a valid user after inputting data', async () => {
    const answers: Answers = {
      name: 'Lorem Ipsum',
      email: 'asdfasdf@gmail.com',
      password: 'asdf12341',
    };
    const inq = new StubInquirer(answers);

    const createUser = new CommandCreateUser(programStub.program, inq as any);
    expect(createUser).to.be.ok;

    await createUser.action();

    const newUser = await db.models.User.findOne({ name: answers.name });
    expect(newUser).to.be.ok;
    if (newUser) {
      expect(newUser.name).to.eq(answers.name);
      expect(newUser.email).to.eq(answers.email);
      expect(newUser.password).to.eq(answers.password);
    }
  });

  it('should display an error if invalid data is provided', async () => {
    const inq = new StubInquirer({});
    const createUser = new CommandCreateUser(programStub.program, inq as any);
    expect(createUser).to.be.ok;

    let err = null;
    try {
      await createUser.action();
    } catch (e) {
      err = e;
    }

    expect(err).to.be.ok;
  });
});
