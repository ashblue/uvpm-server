FROM node:9.3

WORKDIR /usr/src/app

COPY package*.json /usr/src/app/
RUN npm install
COPY . /usr/src/app/

CMD npm run serve:production
EXPOSE 3000
