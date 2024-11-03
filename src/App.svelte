<script lang="ts">
	import { onMount } from 'svelte'
	import './app.postcss'

	let input = $state('')
	let output = $state('')
	let error = $state('')

	let worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

	// Callback function for messages from the worker thread.
	const onMessageReceived = (event: MessageEvent) => {
		output = JSON.stringify(event.data)
	}

	onMount(() => {
		worker.addEventListener('message', onMessageReceived)

		return () => {
			worker.removeEventListener('message', onMessageReceived)
		}
	})

	const generate = () => {
		if (!input) {
			error = 'Please enter some text'
			return
		} else {
			error = ''
		}

		worker.postMessage({
			// TODO - expand to include multiple inputs from user and AI
			// TODO - define a TS interface for this object
			text: input
		})
	}
</script>

<main class="h-full w-full">
	<div class="mx-auto mt-16 w-full max-w-screen-md">
		<h1 class="mb-8 text-4xl">WordSync</h1>
		<div class="grid grid-cols-2 gap-4">
			<input
				bind:value={input}
				class="w-full rounded border border-gray-300 p-2"
				placeholder="Enter guess here"
			/>
			<div class="w-full rounded border border-gray-300 p-2">
				<p>{output}</p>
			</div>
		</div>
		<div class="h-4">
			{#if error}
				<p class="text-red-500">{error}</p>
			{/if}
		</div>
		<button
			type="button"
			aria-label="Generate"
			onclick={generate}
			class="my-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
		>
			Guess
		</button>
	</div>
</main>
