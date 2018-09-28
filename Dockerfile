FROM node:8-alpine

WORKDIR /opt/eva-tester

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY tslint.json .
COPY angular.json .
COPY src/ src/

RUN ls -alh
RUN npm i
RUN npm run build

FROM nginx:alpine

COPY --from=0 /opt/eva-tester/dist/eva-tester /usr/share/nginx/html

