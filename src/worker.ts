import {
	pipeline,
	Text2TextGenerationPipeline,
	type PipelineType,
	type Text2TextGenerationSingle
} from '@huggingface/transformers'
import type { MessageEventToWorker, Round } from './types'
import nlp from 'compromise'

class MyPipeline {
	static task: PipelineType = 'text2text-generation'
	static model = 'Xenova/LaMini-T5-738M'
	static instance: Promise<Text2TextGenerationPipeline> | null = null

	// Progress callback added to the pipeline so that we can track model loading.
	static async getInstance(progress_callback: (progress: unknown) => void) {
		if (this.instance === null) {
			this.instance = pipeline(this.task, this.model, {
				progress_callback
			}) as Promise<Text2TextGenerationPipeline>
		}

		return this.instance
	}
}

// Listen for messages from the main thread
self.addEventListener('message', async (e: MessageEventToWorker) => {
	// Create the pipeline. When called for the first time this will load the pipeline and save them for future use.
	let generator = await MyPipeline.getInstance((progress) => {
		self.postMessage(progress)
	})

	const rounds: Round[] = JSON.parse(e.data)

	// Generate a word
	if (rounds.length === 0) {
		// TODO - Maybe start with a random word from a list of words
		self.postMessage({
			status: 'complete',
			output: 'apple'
		})
		return
	}

	let word = ''
	let formatted = ''
	const doPrompt = async (lastWord: string = '') => {
		const previousRound = rounds[rounds.length - 1]
		console.log(previousRound)
		const prompt = `Return a single word that is associated with these two words (${previousRound.input}, ${previousRound.output}). Previous words were ${rounds.map((round) => `${round.input}, ${round.output}`).join(', ')}, do not show them again. Only respond with "The word is: [word]".`
		console.log(prompt)

		const output = (await generator(prompt, {
			temperature: 2,
			repetition_penalty: 5
		})) as Text2TextGenerationSingle[]

		console.log(output[0].generated_text)
		const generated = nlp(output[0].generated_text).clauses().out('array').at(-1)
		console.log(generated)
		return generated
	}

	while (
		!word ||
		word.split(' ').length !== 1 ||
		rounds.some((round) => round.input === formatted || round.output === formatted)
	) {
		word = await doPrompt()
		formatted = word
			.replaceAll(/[^a-zA-Z]/g, '')
			.trim()
			.toLowerCase()
		console.log(rounds)
		console.log(rounds[0].output === formatted)
		console.log(rounds.some((round) => round.input === formatted || round.output === formatted))
	}

	self.postMessage({
		status: 'complete',
		output: formatted
	})
})
