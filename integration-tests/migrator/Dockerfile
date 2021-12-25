# build img for migrations
FROM node:17-alpine3.12
WORKDIR /usr/src/app
RUN apk update && apk add bash
COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock
RUN yarn install --immutable
COPY migrations/ /usr/src/app/migrations
COPY migrate.js /usr/src/app/migrate.js
COPY ./wait-for.sh /usr/src/app/wait-for.sh
COPY ./docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

CMD node migrate up && node migrate executed && node migrate pending && sleep infinity
