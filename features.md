- take your endpoint with you
- delete your data forever
- cycle keys
- state diffs
- tags (what does this mean?)
- idempotency keys

## pro

- side effects
- take your data with you (we delete event data on non-pro plans every so often)
- side effects function that returns data about the effects the state change should have on the world (email, slack, webhook)
- timed hooks
- unlimited revokable read-keys and write-keys
- state and body encryption
- use npm packages??
  - maybe its a deno worker
- websocket with latest state
- side effects.... publish your state updates to
  - SQS
  - slack
  - Webhook
    - option to bulk them (like async cargo)
  - Another Hook Reducer
- priority runtime
- expiring keys?
- increased throughput and body size
- increased timeout
- convert transports.... like take a webhook reduce it to a rabitmq/sqs event or vice versa

## Enterprise

- your code runs on a separate server, database

### thoughtlog

- named access keys
- config vs secrets
- define config through code with https://jsontypedef.com/
