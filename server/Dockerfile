# Build Image
FROM node@sha256:da7ef512955c906b6fa84a02295a56d0172b2eb57e09286ec7abc02cfbb4c726 as build
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock
COPY docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh
RUN yarn install --immutable --production=true





# this hash is found by running 
# $ docker pull node:lts-alpine
# and looking for the digest in the output
FROM node@sha256:da7ef512955c906b6fa84a02295a56d0172b2eb57e09286ec7abc02cfbb4c726
RUN apk add dumb-init
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app
ENV PORT 3001
EXPOSE 3001
RUN yarn build
RUN rm -rf src
# Do not give container root access
USER node
ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["node", "dist/index.js"]