# build img for migrations
FROM node:17-alpine3.12
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock
RUN yarn install --immutable --production=true
COPY migrations/ /usr/src/app/migrations
COPY ./wait-for.sh /usr/src/app/wait-for.sh
ENTRYPOINT "/bin/sh"
CMD ["sleep", "3000", "&&", "node", "migrate", "up"]