- take your endpoint with you
- delete your data forever
- cycle keys
- LSH hashing in db to show "similar" requests?
  - https://github.com/dsablic/node-nilsimsa#readme
- state diffs
- tags
- must record each state change
- http oracle

## pro

- take your data with you (we delete event data on non-pro plans every so often)
- side effects function that returns data about the effects the state change should have on the world (email, slack, webhook)
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
- convert transports.... like take a webhook reduce it to a rabitmq/sqs event or vice versa

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

## secrets

- separate express server?
- secrets are in groups
  - you can list them by group name (in this case hook id?)
- key encryption key?
- crud at the key level
- need to delete group when hook is removed
- namespaces are in plain text on the secret server
- but, hook has a secret namespace column, and it is encrypted with env var
- our secret server can be hit by anyone in our private network, but knowing the namespace is key
- secret server not responsible for access, that's the monolith

```
app POST /namespaces on secret server
  res: { secret: 'foobar' }
  // sha1("foobar") stored on
```
