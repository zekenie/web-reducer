FROM node@sha256:1a9a71ea86aad332aa7740316d4111ee1bd4e890df47d3b5eff3e5bded3b3d10 as build
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
# COPY package-lock.json /usr/src/app/package-lock.json
COPY yarn.lock /usr/src/app/yarn.lock
COPY express-server/package.json /usr/src/app/express-server/package.json
COPY express-server/yarn.lock /usr/src/app/express-server/yarn.lock
COPY docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh
RUN yarn install --immutable --production=true
RUN cd ./express-server && \
    yarn install --immutable --production=true

FROM node@sha256:1a9a71ea86aad332aa7740316d4111ee1bd4e890df47d3b5eff3e5bded3b3d10
RUN apk add dumb-init
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node --from=build /usr/src/app/express-server/node_modules /usr/src/app/express-server/node_modules
COPY --chown=node:node . /usr/src/app
ENV PORT 3000
EXPOSE 3000
RUN yarn build
RUN cd ./express-server && yarn build
RUN rm -rf express-server/src
RUN rm -rf app
USER node
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "express-server/dist/index.js"]
