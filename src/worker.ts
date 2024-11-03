import { Pipeline, pipeline, Text2TextGenerationPipeline, type PipelineType } from '@huggingface/transformers'

class Text2TextPipeline {
	static task: PipelineType = 'text2text-generation'
	static model = 'Xenova/LaMini-Flan-T5-783M'
	static instance: Promise<Text2TextGenerationPipeline> | null = null

	// Progress callback added to the pipeline so that we can track model loading.
	static async getInstance(progress_callback: (progress: number) => void) {
		if (this.instance === null) {
			this.instance = pipeline(this.task, this.model, { progress_callback }) as Promise<Text2TextGenerationPipeline>
		}

		return this.instance
	}
}

// TODO - Add a prompt to the pipeline based on previous words, not current input.
const prompt = ''

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
	// Retrieve the pipeline. When called for the first time this will load the pipeline and save it for future use.
	let generator = await Text2TextPipeline.getInstance(progress => {
		self.postMessage(progress)
	})

	// Generate the response
	// TODO - Get response for previous words, not current input.
	let output = await generator(event.data.text)
	
	self.postMessage({
		status: 'complete',
		output: output,
	})
})