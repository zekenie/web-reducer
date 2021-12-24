# Build Image
FROM node@sha256:a9b9cb880fa429b0bea899cd3b1bc081ab7277cc97e6d2dcd84bd9753b2027e1 as build
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock
RUN yarn install --immutable --production=true





# this hash is found by running 
# $ docker pull node:lts-alpine
# and looking for the digest in the output
FROM node@sha256:a9b9cb880fa429b0bea899cd3b1bc081ab7277cc97e6d2dcd84bd9753b2027e1
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

CMD ["dumb-init", "node", "dist/index.js"]