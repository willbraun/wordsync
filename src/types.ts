export interface WorkerMessage extends Object {
	status: WorkerMessageStatus
	name?: string
	model?: string
	file?: string
	progress?: number
	loaded?: number
	total?: number
	output?: string
}

export const WorkerMessageStatus = {
	INITIATE: 'initiate',
	PROGRESS: 'progress',
	DONE: 'done',
	READY: 'ready',
	COMPLETE: 'complete'
} as const

export type WorkerMessageStatus = (typeof WorkerMessageStatus)[keyof typeof WorkerMessageStatus]

export interface WorkerMessageEvent extends MessageEvent {
	data: WorkerMessage
}

export interface Round {
	input: string
	output: string
}

export interface MessageEventToWorker extends MessageEvent {
	data: string
}
