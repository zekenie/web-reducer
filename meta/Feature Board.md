---

kanban-plugin: basic

---

## Considering

- [ ] [[JS or React library]]
- [ ] #security should typescript compile happen in thread?
- [ ] #security is it better to expose an [HMAC function](https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428?permalink_comment_id=4052765#gistcomment-4052765) than to give over all of crypto??
- [ ] If we stored latest state in redis, we could have access to it in responder


## Todo

- [ ] Real publish UI
- [ ] don't let publish happen if editor has severe errors
- [ ] Delete requests
- [ ] #security restrict outbound network traffic from runner
- [ ] typescript compiling should be in a thread #security
- [ ] onboarding info in tool tip when signup is hovered #onboarding
- [ ] after request have editor [start typing](https://github.com/convergencelabs/monaco-collab-ext) #onboarding
- [ ] publish on cmd + s?
- [ ] prettier in editor
- [ ] cap number of rows in requests table


## Must have for launch

- [ ] #bug race condition with refresh tokens used in parallel
- [ ] CRUD for read/write keys
- [ ] Public websocket endpoint
- [ ] public html page for read key
- [ ] Deployment
- [ ] Request detail view/modal
- [ ] Hooks list view
- [ ] how are read/write keys actuall hit?
- [ ] server crashes on runner error. [best practice for uncaught exceptions](https://www.honeybadger.io/blog/errors-nodejs/#uncaught-exceptions-and-unhandled-promise-rejections)


## In Progress

- [ ] Requests table<br>- [x] Pagination<br>- [x] Websocket updates<br>- [ ] console output<br>- [ ] Idempotency key violation?


## Done

**Complete**
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