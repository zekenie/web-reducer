# Build Image
FROM node@sha256:1a9a71ea86aad332aa7740316d4111ee1bd4e890df47d3b5eff3e5bded3b3d10 as build
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock
COPY docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh
RUN yarn install --immutable





# this hash is found by running 
# $ docker pull node:lts-alpine
# and looking for the digest in the output
FROM node@sha256:1a9a71ea86aad332aa7740316d4111ee1bd4e890df47d3b5eff3e5bded3b3d10
RUN apk add dumb-init
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app
ENV PORT 3002
EXPOSE 3002
RUN yarn build
RUN rm -rf src
# Do not give container root access
USER node
ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["node", "dist/index.js"]