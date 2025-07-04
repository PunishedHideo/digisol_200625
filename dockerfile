FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
# RUN npm install -g typescript
RUN npm run build
COPY . .

EXPOSE 3000
CMD ["npm", "run", "start:prod"]