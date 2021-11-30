It's very important that webhooks are processed in order. we do not want two webhooks getting right behind each other in a queue with multiple lanes and having a race condition. This means that we need concurency 1. But that also means we'll have long long latency to process jobs if we have spikes in traffic.

## Solution idea 1: have many shared queues. Each endpoint hashes to a queue, but the queue is shared with several endpoints

Let's say we construct 5 lanes

queue-1
queue-2
queue-3
queue-4
queue-5

Every endpoint hashes to a queue number. This hash doesn't require data lookup, it's deterministic based on the endpoint ID alone.

### problem: increasing the number of lanes? how do you do that?

Make namespaces? Those can live in the db, but essentailly like a customer id or something that gets its one queues. At boot time, those queues are created. At boot time for the http process we pull in the known specail namespaces

If we could figure out how to let a shared queue drain before starting the others..... that'd be ideal. But it could still be enqueueing by another customer.

### reassign everything to new lanes

If we could just reassign jobs to different queues that'd be ideal.

Maybe the queue name is prepended with the release number

queue-114-1
queue-114-2
queue-114-3
queue-114-4

When we release 115 we have 5 lanes. We boot up the old queues and the new ones. New queues are not processing, but are getting new payloads enqueued. We drain the old queues into the new ones using `{ lifo: true }`. Once they're drained we turn the new queues on.

queue-114-1
queue-114-2
queue-114-3
queue-114-4

queue-115-1
queue-115-2
queue-115-3
queue-115-4
queue-115-5

We get jobs from each of the old queues

### have downtime?

---=-=-=-=-=-=-=

OK. Think different. We have one queue for incoming webhooks just to keep the db safe from huge spikes. But we have high concurency on this. There _are_ race conditions for which payload gets processed first. But the job just inserts into the db and stores the timestamp of when the request was recieved.

In the state table, we store the timestamp that the current state of the endpoint is at. We're able to have a job that reads all the events that have come in since that state, and processes them in bulk. Then, the job to sync the state becomes a bulk action. That means there's never _ever_ a chance for a race condition, because the payloads will be processed in order. We can also give the jobs the same id, meaning that if you enqueue two at once, it will only respect the first one.

maybe debounce adding these bulk jobs
https://github.com/RyosukeCla/node-distributed-debounce

-=-=-=-=-=-

Try again. Combine some aspects from previous proposals.

We have a queue with high concurency for ingestion. This just puts an upper limit on the db strain while under high pressure. Race conditions don't matter, we just capture info.

We have a series of queues for processing. The reason we don't batch them is because it creates the possibliity of weird edge cases where a new one is forgotten. Hard to make sure we don't miss an event in postgres and have to wait for another payload to have it be processed.

State recreations are different. They can be bulk.

When you need to change the number of queues to handle peaks, you could wipe them out of redis altogeher and recreate them from the db?

-=-=-=-=

Today:

- get schema up and running
- slonik
- logging
- Get a single endpoint working from db, accepting webhooks, getting them processed

- hooks
- request
  - writekey
  - body
  - createdAt
- key
  - key
  - type - read | write
