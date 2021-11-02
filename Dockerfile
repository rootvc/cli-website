FROM node:14-slim

WORKDIR /usr/src

ADD package.json .
RUN npm install

# COPY ./* /usr/src/

RUN npm run build

EXPOSE 8888

CMD npm start