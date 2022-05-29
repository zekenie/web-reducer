Summary:: Touch external systems out of the hook flow. Once a request is processed, side effects like emails, http requests, etc can run
MVP:: false

- Side effects are not replayed when hook code changes, they run once.