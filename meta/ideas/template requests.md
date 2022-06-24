in your code, you'd come up with some templates like this

```js
template('new game', state => ({

	player: {

		name: input('player name'),
		maxPlayers(select(10,15,20)),
		foo: select(...state.bar.map())

	},

}))
```

Somehow this would be rendered in client where users could fill out template and make requests.

Perhaps what's served up to the UI would look like

```json
{
	"player": {
		"name": {
			"__wr_type": "input",
		},
		"maxPlayers": {
			"__wr_type": "select",
			"__wr_options": [10, 25, 25]
		}
	}
}
```

These would need to be persisted somewhere. Probably on publish we'd add a config step to the runner....

Could support later features like [[ideas/scheduled-requests]]