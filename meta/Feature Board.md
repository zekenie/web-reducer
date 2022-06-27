---

kanban-plugin: basic

---

## Considering

- [ ] [[JS or React library]]
- [ ] #security should typescript compile happen in thread?
- [ ] If we stored latest state in redis, we could have access to it in responder
- [ ] should state be cached in redis? we could do readkeys with postgres down (and faster), we could have lastState on responder.... lots to like
- [ ] should there be a way to do self requests from the ui to test? going to curl is annoying? request modal?
- [ ] Should we consider using [this data grid library](https://grid.glideapps.com/)
- [ ] qr code resource?
- [ ] we need a way for (ideally the runner) to expose declarations as static assets that can be hit by client and cached, then passed to editor
- [ ] what happens if you open the editor in 2 windows..... weird race condition about draft updates?
- [ ] what if the runtime had access to a secret namespace?
- [ ] keys table could count reqs? be able to open a modal to filter by reqs by key?


## Todo

- [ ] server crashes on runner error. [best practice for uncaught exceptions](https://www.honeybadger.io/blog/errors-nodejs/#uncaught-exceptions-and-unhandled-promise-rejections)
- [ ] curl response is an opportunity to educate
- [ ] Real publish UI<br>- [x] will they notice publish? should it bounce?<br>- [ ] publish on cmd + s <br>- [x] should prettier run? Or should it run at another time ![[Pasted image 20220610084309.png]]<br>- [ ] Don't let publish happen if editor has severe errors
- [ ] webhooks may be put requests right? we shouldn't assume post.
- [ ] #bug if you return req from reducer you get a 500 error
- [ ] Delete / ignore requests
- [ ] #security restrict outbound network traffic from runner
- [ ] typescript compiling should be in a thread #security
- [ ] you should have access to the read keys at run time
- [ ] onboarding info in tool tip when signup is hovered #onboarding
- [ ] cap number of rows in requests table
- [ ] automatic key rotation #security
- [ ] there should be api keys between services #security
- [ ] can i delete a hook?
- [ ] #bug stack tracke numbers are off when there are comments preceeding the code block
- [ ] #security limit length of console artifacts
- [ ] request time availible in req obj


## Must have for launch

- [ ] Minimal solution for mobile clients... some web page
- [ ] writeKey section on docs
- [ ] add test for options requests for write endpoint
- [ ] more robust console feature


## In Progress



## Done

**Complete**
- [x] [make sockets more durable](https://medium.com/voodoo-engineering/websockets-on-production-with-node-js-bdc82d07bb9f)
- [x] reset state, clear requests
- [x] get to legal from unauthenticated state
- [x] Hooks list view
- [x] should "key" be called "endpoints" or "access"
- [x] number of requests
- [x] modal to test request
- [x] why do hooks have the name they do? what's the point? can i edit it? what about description
- [x] app should open on a hook of your own for unauthenticated users<br><br>- [x] guest users should have hook built by default<br>- [ ] pool of hooks?
- [x] domain setup
- [x] GH link
- [x] documentation<br><br>- [x] mdx file<br>- [x] sidebar<br>- [ ] new window<br>- [x] sections<br>  - [x] functions we call<br>  - [x] functions you can call
- [x] Request detail view/modal
- [x] after request have editor [start typing](https://github.com/convergencelabs/monaco-collab-ext) #onboarding
- [x] secrets need to be avilable to responder
- [x] dismissible info panels
- [x] do we need isAuthentic?
- [x] uuid function
- [x] #security is it better to expose an [HMAC function](https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428?permalink_comment_id=4052765#gistcomment-4052765) than to give over all of crypto??<br><br>Yes, absolutely should not give node crypto. Maybe [this](https://github.com/paulmillr/noble-hashes) no dependency lib... maybe [subtle crypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto), but it's async :/<br><br>It's also possible that we need hmac verification specifically to be a feature of the platform, and just configured by hook authors. For example we could use [this express middleware](https://github.com/connorjburton/hmac-auth-express). Then HMAC validation is opt in and config. This particular lib is kinda unpopular, but it does give an interesting idea for the contract
- [x] need to be able to send email
- [x] if you make requests with a write key, then delete the write key, then recompute state, those requests are not counted! #bug<br><br>Solutions:<br>- soft delete the write keys?<br>- store an association of requests to hook?<br>---<br>- Could this be a feature?
- [x] status code > 399 should be ignored
- [x] error when navigating back and forth to editor pages ![[Pasted image 20220609110251.png]] #bug
- [x] #bug race condition for bulk update updating the UI
- [x] bulk updates need to emit new state event to public `ws`
- [x] #bug when you make a request with no content type you get an error
- [x] ![[Pasted image 20220609103937.png]] #bug
- [x] how are read/write keys actually hit?
- [x] Deployment
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