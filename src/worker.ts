import {
	Pipeline,
	pipeline,
	Text2TextGenerationPipeline,
	type PipelineType,
	type Text2TextGenerationSingle
} from '@huggingface/transformers'

class Text2TextPipeline {
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
self.addEventListener('message', async (event) => {
	// Retrieve the pipeline. When called for the first time this will load the pipeline and save it for future use.
	let generator = await Text2TextPipeline.getInstance((progress) => {
		self.postMessage(progress)
	})

	// Generate the response
	let prompt
	if (event.data.previousInput && event.data.previousOutput) {
		prompt = `Generate a single word that is equally related to both of the following words: ${event.data.previousInput} and ${event.data.previousOutput}`
	} else {
		prompt = 'Generate a random word'
	}

	let output = (await generator(prompt)) as Text2TextGenerationSingle[]
	let formattedOutput: string = output[0].generated_text.toLowerCase().trim().replaceAll('"', '')

	self.postMessage({
		status: 'complete',
		output: formattedOutput
	})
})
