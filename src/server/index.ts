/* Доброго времени суток! Некоторые дизайнерские решения в коде могут показаться слегка
глуповатыми, однако я пытался писать код как можно быстрее и продуктивнее чтобы получить готовый проект.

Выполнять в консоли:
cd *путь к папке проекта* - если уже не в папке с проектом
npm run build
npm run start:prod

После зайти на в браузере на URL
http://127.0.0.1:3000

За основу взял бэк экспресса как и было указано, фронт выбрал чистый html css и js

Удачи!
*/

import express from 'express';
import router from './router.js';
// import cors from 'cors'
import path from 'path';

const server = express();

server.use(express.json({ limit: '50mb' })); // ugly but fast solution
server.use(router);
server.use(express.static(path.resolve('src/client/public')));

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
