import {
	Pipeline,
	pipeline,
	Text2TextGenerationPipeline,
	type PipelineType,
	type Text2TextGenerationSingle
} from '@huggingface/transformers'
import type { MessageEventToWorker, Round } from './types'

class MyPipeline {
	static task: PipelineType = 'text2text-generation'
	static model = 'Xenova/LaMini-Flan-T5-783M'
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
	// Retrieve the pipeline. When called for the first time this will load the pipeline and save it for future use.
	let generator = await MyPipeline.getInstance((progress) => {
		self.postMessage(progress)
	})

	const rounds: Round[] = JSON.parse(e.data)

	// Generate the response
	let rawText = ''
	const doPrompt = async () => {
		let prompt
		if (rounds.length > 0) {
			const previousRound = rounds.at(-1) ?? { input: '', output: '' }
			prompt = `Generate a ONE WORD noun that is equally related to both of the following words: ${previousRound.input} and ${previousRound.output}. Your word CANNOT be in this list AND CANNOT INCLUDE words from this list: ${rounds.map((round) => `${round.input}, ${round.output}`).join(', ')}.`
		} else {
			prompt = 'Generate a ONE WORD noun. Your response must be one word.'
		}

		let output = (await generator(prompt, {
			temperature: 2
		})) as Text2TextGenerationSingle[]

		return output[0]?.generated_text
	}

	// Check if response is valid and prompt again if not
	rawText = await doPrompt()

	let formattedOutput = rawText
		.toLowerCase()
		.trim()
		.replaceAll(/[^a-zA-Z]/g, '')

	self.postMessage({
		status: 'complete',
		output: formattedOutput
	})
})
