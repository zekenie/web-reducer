---

kanban-plugin: basic

---

## Considering

- [ ] [[JS or React library]]
- [ ] requests empty state -> "Curl it for me" button
- [ ] public html page for read key
- [ ] refactor runtime code to use class


## Todo

- [ ] CRUD for read/write keys
- [ ] Hooks list view
- [ ] Signup flow
- [ ] Deployment
- [ ] Real publish UI
- [ ] don't let publish happen if editor has severe errors
- [ ] Request detail view/modal
- [ ] Public websocket endpoint
- [ ] Edit secret interface
- [ ] Delete requests
- [ ] restrict outbound network traffic from runner
- [ ] requests table needs to reload when bulk update happens
- [ ] typescript compiling should be in a thread


## In Progress

- [ ] monaco editor intellisense
- [ ] Requests table<br>- [ ] Pagination<br>- [x] Websocket updates


## Done

- [ ] fix copyable code element to work
- [ ] [[Custom Responses]]<br><br>- [x] runner has `responder` method<br>- [x] server uses `responder` method on runner<br>- [x] write test of custom response in integration test
- [ ] Import crypto into runtime




%% kanban:settings
```
{"kanban-plugin":"basic"}
```
%%