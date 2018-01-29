import { CommandCollection } from './collection/command-collection';
import * as commander from 'commander';
import * as inquirer from 'inquirer';

const commandCollection = new CommandCollection(new commander.Command(), inquirer);
commandCollection.listen();
