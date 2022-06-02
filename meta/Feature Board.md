---

kanban-plugin: basic

---

## Considering

- [ ] [[JS or React library]]
- [ ] requests empty state -> "Curl it for me" button
- [ ] #security should typescript compile happen in thread?
- [ ] #security is it better to expose an [HMAC function](https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428?permalink_comment_id=4052765#gistcomment-4052765) than to give over all of crypto??


## Todo

- [ ] CRUD for read/write keys
- [ ] Hooks list view
- [ ] Deployment
- [ ] public html page for read key
- [ ] Real publish UI
- [ ] Public websocket endpoint
- [ ] Request detail view/modal
- [ ] Edit secret interface
- [ ] Delete requests
- [ ] don't let publish happen if editor has severe errors
- [ ] #security restrict outbound network traffic from runner
- [ ] typescript compiling should be in a thread #security
- [ ] hook index view


## In Progress

- [ ] Requests table<br>- [ ] Pagination<br>- [x] Websocket updates


## Done

**Complete**
- [x] Signup flow
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