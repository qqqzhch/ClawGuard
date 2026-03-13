import chalk from 'chalk';

export const logger = {
  info(message: string): void {
    console.log(chalk.blue('?'), message);
  },
  success(message: string): void {
    console.log(chalk.green('+'), message);
  },
  error(message: string): void {
    console.log(chalk.red('x'), message);
  },
  warn(message: string): void {
    console.log(chalk.yellow('!'), message);
  },
};
