import { App } from './app/app';
import { appConfig } from './app/helpers/app-config';

const PORT: number = parseInt(process.env.PORT as string, 10) || appConfig.DEFAULT_PORT;
const app = new App(true);

app.createServer(PORT);
