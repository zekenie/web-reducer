Summary:: Don't expose an entire object with your read hook, instead have a function (or functions) that expose parts programatically
MVP:: false

## Example

```js

function reducer(prevState, request) {
	return {
		...prevState,
		[request.body.uuid]: (prevState[request.body.uuid] || 0) + 1,
	}
}

view(state, queryParams) {
	const allCounts = 
	return [Math.max(allCounts), Math.min(allCounts)];
}

```