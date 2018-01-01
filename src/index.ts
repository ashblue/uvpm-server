import { App } from './app/app';

const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;
const app = new App(true);

app.createServer(PORT);
