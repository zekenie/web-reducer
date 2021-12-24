FROM node:17-alpine3.12
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock
RUN yarn install --immutable
COPY tsconfig.json /usr/src/app/tsconfig.json
COPY jest.config.js /usr/src/app/jest.config.js
COPY src/ /usr/src/app/src/
CMD ["yarn", "jest", "--bail"]
