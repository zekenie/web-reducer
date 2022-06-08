---

kanban-plugin: basic

---

## Considering

- [ ] [[JS or React library]]
- [ ] #security should typescript compile happen in thread?
- [ ] #security is it better to expose an [HMAC function](https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428?permalink_comment_id=4052765#gistcomment-4052765) than to give over all of crypto??
- [ ] If we stored latest state in redis, we could have access to it in responder
- [ ] should state be cached in redis? we could do readkeys with postgres down (and faster), we could have lastState on responder.... lots to like
- [ ] should there be a way to do self requests from the ui to test? going to curl is annoying? request modal?
- [ ] Should we consider using []this data grid library](https://grid.glideapps.com/)
- [ ] have a qr endpoint for the img


## Todo

- [ ] Real publish UI<br>- [ ] will they notice publish? should it bounce?<br>- [ ] publish on cmd + s <br>- [ ] should prettier run? Or should it run at another time<br>- [ ] Don't let publish happen if editor has severe errors
- [ ] Delete / ignore requests
- [ ] #security restrict outbound network traffic from runner
- [ ] typescript compiling should be in a thread #security
- [ ] onboarding info in tool tip when signup is hovered #onboarding
- [ ] after request have editor [start typing](https://github.com/convergencelabs/monaco-collab-ext) #onboarding
- [ ] cap number of rows in requests table
- [ ] why do hooks have the name they do? what's the point? can i edit it? what about description
- [ ] can i delete a hook?
- [ ] modal to test request


## Must have for launch

- [ ] #bug race condition for bulk update updating the UI
- [ ] Request detail view/modal
- [ ] Hooks list view
- [ ] how are read/write keys actually hit?
- [ ] server crashes on runner error. [best practice for uncaught exceptions](https://www.honeybadger.io/blog/errors-nodejs/#uncaught-exceptions-and-unhandled-promise-rejections)
- [ ] if you make requests with a write key, then delete the write key, then recompute state, those requests are not counted! #bug<br><br>Solutions:<br>- soft delete the write keys?<br>- store an association of requests to hook?<br>---<br>- Could this be a feature?
- [ ] webhooks may be put requests right? we shouldn't assume post.
- [ ] bulk updates need to emit new state event to public `ws`


## In Progress

- [ ] Deployment


## Done

**Complete**
- [x] public html page for read key<br>- use [this library](https://github.com/xyc/react-object-inspector)?<br>- Or perhpas [this library](https://github.com/iendeavor/object-visualizer) that does not require react?<br>- template engine eta looks modern
- [x] CRUD for read/write keys
- [x] #bug throwing errors in reducer crashes server
- [x] Requests table<br>- [x] Pagination<br>- [x] Websocket updates<br>- [x] console output<br>- [ ] Idempotency key violation?
- [x] Public websocket endpoint
- [x] #bug race condition with refresh tokens used in parallel
- [x] #bug const reducer fails because reducer was already declared
- [x] Signup flow
- [x] requests empty state -> "Curl it for me" button #onboarding
- [x] expose UrlSearchParams in request
- [ ] response headers are respected
- [ ] requests table needs to reload when bulk update happens<br><br>- [x] ws event<br>- [x] ui update
- [ ] monaco editor intellisense
- [ ] fix copyable code element to work
- [ ] [[Custom Responses]]<br><br>- [x] runner has `responder` method<br>- [x] server uses `responder` method on runner<br>- [x] write test of custom response in integration test
- [ ] Import crypto into runtime




%% kanban:settings
```
{"kanban-plugin":"basic"}
```
%%