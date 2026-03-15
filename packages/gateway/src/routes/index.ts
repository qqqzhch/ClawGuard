import { Hono } from 'hono';
import backups from './backups.js';
import restores from './restores.js';
import schedules from './schedules.js';
import logs from './logs.js';
import config from './config.js';

const app = new Hono();

app.route('/backups', backups);
app.route('/restores', restores);
app.route('/schedules', schedules);
app.route('/logs', logs);
app.route('/config', config);

export default app;
