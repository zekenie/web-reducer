FROM node:17-alpine3.12
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock
RUN yarn install --immutable
COPY tsconfig.json /usr/src/app/tsconfig.json
COPY jest.config.js /usr/src/app/jest.config.js
COPY src/ /usr/src/app/src/
COPY ./docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

CMD yarn jest --bail --runInBand $JEST_ARGS --detectOpenHandles
