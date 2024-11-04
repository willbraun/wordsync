<script lang="ts">
	import { onMount } from 'svelte'
	import './app.postcss'
	import {
		WorkerMessageStatus,
		type Round,
		type WorkerMessage,
		type WorkerMessageEvent
	} from './types'

	let input = $state('')
	let output = $state('')
	let error = $state('')
	let ready = $state(false)
	let progressItems: WorkerMessage[] = $state([])
	let loading = $state(false)
	let rounds: Round[] = $state([])

	let worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

	// Callback function for messages from the worker thread.
	const onMessageReceived = (e: WorkerMessageEvent) => {
		switch (e.data.status) {
			case WorkerMessageStatus.INITIATE:
				progressItems = [...progressItems, e.data]
			case WorkerMessageStatus.PROGRESS:
				progressItems = progressItems.map((item) => {
					if (item.file === e.data.file) {
						return { ...item, progress: e.data.progress }
					}
					return item
				})
				break
			case WorkerMessageStatus.DONE:
				progressItems = progressItems.filter((item) => item.file !== e.data.file)
			case WorkerMessageStatus.READY:
				ready = true
				break
			case WorkerMessageStatus.COMPLETE:
				loading = false
				output = e.data?.output ?? 'no response'
				rounds = [...rounds, { input, output }]
				break
		}
	}

	onMount(() => {
		worker.addEventListener('message', onMessageReceived)

		return () => {
			worker.removeEventListener('message', onMessageReceived)
		}
	})

	const guessWord = () => {
		if (!input) {
			error = 'Please enter some text'
			return
		} else {
			loading = true
			error = ''
		}

		worker.postMessage({
			previousInput: rounds.at(-1)?.input ?? '',
			prevousOutput: rounds.at(-1)?.output ?? ''
		})
	}
</script>

<main class="h-screen w-full bg-slate-200">
	<div class="mx-auto flex h-full w-full max-w-screen-md flex-col gap-4 px-4 pt-16">
		<h1 class="text-4xl">WordSync</h1>
		<div
			class="relative flex grow flex-col justify-end rounded-xl border-2 border-slate-300 bg-slate-100"
		>
			{#each rounds as round, i}
				<div class="grid grid-cols-2">
					<div class="absolute left-4">
						{i + 1}
					</div>
					<div class="text-center">
						{round.input}
					</div>
					<div class="text-center">
						{round.output}
					</div>
				</div>
			{/each}
		</div>
		<div class="">
			<div class="grid grid-cols-2 gap-4">
				<input
					bind:value={input}
					class="w-full rounded border border-gray-300 p-2"
					placeholder="Enter guess here"
				/>
				<div class="w-full rounded border border-gray-300 bg-white p-2">
					<p>{output}</p>
				</div>
			</div>
			<div class="h-2">
				{#if error}
					<p class="text-sm text-red-500">{error}</p>
				{/if}
			</div>
			<button
				type="button"
				disabled={loading}
				aria-label="Guess"
				onclick={guessWord}
				class="my-4 flex h-12 w-full items-center justify-center rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
			>
				{#if loading}
					<div
						class="inline-block size-6 animate-spin rounded-full border-[3px] border-current border-t-transparent text-gray-800 dark:text-white"
						role="status"
						aria-label="loading"
					>
						<span class="sr-only">Loading...</span>
					</div>
				{:else}
					Guess a word!
				{/if}
			</button>
		</div>
	</div>
</main>
