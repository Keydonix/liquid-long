import { Scheduler } from './scheduler.js'

export class PolledValue<TValue> {
	private lastKnownGood: TValue | undefined
	private outstandingFetch: Promise<TValue> | null
	private readonly listeners: Array<(newValue: TValue, oldValue: TValue | undefined) => void> = []
	private scheduledTaskId: any | null = null

	public constructor(
		private readonly scheduler: Scheduler,
		private readonly fetcher: () => Promise<TValue>,
		private readonly frequencyInMilliseconds: number
	) {
		this.lastKnownGood = undefined
		this.outstandingFetch = this.fetch()
	}

	public get cached(): Promise<TValue> { return this.lastKnownGood ? Promise.resolve(this.lastKnownGood) : this.latest }
	public get latest(): Promise<TValue> { return this.outstandingFetch || this.fetch() }

	public registerListener = (listener: (newValue: TValue, oldValue: TValue | undefined) => void): void => {
		this.listeners.push(listener)
	}

	public shutdown = async (): Promise<void> => {
		await this.outstandingFetch
		// this is sketchy, it depends on this continuation getting executed after the `fetch` continuation. need to verify if that is standardized or not just lucky
		this.scheduler.cancelAll()
	}

	private fetch = async (): Promise<TValue> => {
		try {
			if (this.scheduledTaskId !== null) this.scheduler.cancel(this.scheduledTaskId)
			const previousValue = this.lastKnownGood
			this.outstandingFetch = this.fetcher()
			const newValue = await this.outstandingFetch
			this.lastKnownGood = newValue
			this.outstandingFetch = null
			this.listeners.forEach(listener => listener(newValue, previousValue))
			return this.lastKnownGood
		} finally {
			this.scheduledTaskId = this.scheduler.schedule(this.frequencyInMilliseconds, this.fetch)
		}
	}
}
