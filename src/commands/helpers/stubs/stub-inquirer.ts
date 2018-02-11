import { Answers } from 'inquirer';

export class StubInquirer {
  constructor (private answers?: Answers) {
  }

  /**
   * Stubbed method that circumvents inquirer
   * @param questions
   * @returns {Promise<inquirer.Answers>}
   */
  public prompt (questions: any): Promise<Answers> {
    return new Promise<Answers>((resolve) => {
      resolve(this.answers);
    });
  }
}
