import { Answers } from 'inquirer';

export class StubInquirer {
  // public promptSpy: SinonSpy;

  constructor (private answers?: Answers) {
    // this.promptSpy = sinon.spy(this, 'prompt');
  }

  /**
   * Stubbed method that circumvents inquirer
   * @param questions
   * @returns {Promise<inquirer.Answers>}
   */
  public prompt (questions): Promise<Answers> {
    return new Promise<Answers>((resolve) => {
      resolve(this.answers);
    });
  }
}
