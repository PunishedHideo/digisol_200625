/* Доброго времени суток! Некоторые дизайнерские решения в коде могут показаться слегка
глуповатыми(или нечитабельными), однако я пытался писать код как можно быстрее и продуктивнее чтобы получить MVP
Также не стал сильно заморачиваться с типами тайпскрипта, чтобы не замедлятся

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
// import path from 'path';
// import compression from 'compression'

const server = express();

server.use(express.static('src/client/public'));
// server.use(express.json({ limit: '10mb' }));
server.use(router);

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
