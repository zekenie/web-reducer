Summary:: Auto-request on a schedule
MVP:: false


## brainstorm
- have a `scheduledRequests` table
- hookId
- writeKey (that user has access to)
- payload
- interval: minute | hour | day | week
- value: number
- lastInvocation

Have a single bull job for each second that queries every scheduled request who's outside its interval, then update the lastInvocation

For each of them it enqueues a job to process the request