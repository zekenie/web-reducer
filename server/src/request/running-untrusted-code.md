# entities

## web servier

- authentication
- create hooks
- modify hooks
- accept new payload and enqueue

## launcher

- has network access to `runner`
- pulls from bull and fetchs code and payload
- sends to runner
- takes state as response and writes to db

## runner

- basic docker container with node
- there's a program on it running that has the following endpoints

  - /run
    - takes code and payload
    - runs it in vm2
    - responds with state

- notes
  - this is an express app that is in a private network
  - has no access to db
  - essentailly an http endpoint to run arbitrary code with arbitrary data
  - process and os isolation from launcher and web server
