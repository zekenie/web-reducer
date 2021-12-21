- take your endpoint with you
- delete your data forever
- cycle keys
- LSH hashing in db to show "similar" requests?
  - https://github.com/dsablic/node-nilsimsa#readme
- state diffs
- tags
- must record each state change

## pro

- take your data with you (we delete event data on non-pro plans every so often)
- timed hooks
- unlimited revokable read-keys and write-keys
- idempotency keys
- state and body encryption
- use npm packages
- websocket with latest state
- publish your state updates to
  - SQS
  - Webhook
    - option to bulk them (like async cargo)
  - Another Hook Reducer
- priority runtime
- expiring keys?
- increased throughput and body size
- increased timeout

## Enterprise

- your code runs on a separate server, database

### thoughtlog

- need some concept of drafts or revisions
- hook has many drafts
- one draft is published
- request gets state for each draft
- requests get written to a write key, but state.... state has to be elsewhere
- state needs to be connected to draft
- there will have to be some mechanism to bulk change state when code changes
- having state be its own table because we can bulk insert
- will have to stream requests and do the whole async cargo queue thing
- versions workflow states will something like "provisioning"
