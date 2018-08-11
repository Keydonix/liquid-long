import { Scheduler } from './scheduler'

export class PolledValue<TValue> {
	private readonly scheduler: Scheduler
	private readonly fetcher: () => Promise<TValue>
	private readonly frequencyInMilliseconds: number

	private lastKnownGood: TValue
	private outstandingFetch: Promise<TValue> | null
	private readonly listeners: Array<(newValue: TValue, oldValue: TValue) => void> = []
	private scheduledTaskId: any | null = null

	public constructor(scheduler: Scheduler, fetcher: () => Promise<TValue>, frequencyInMilliseconds: number, defaultValue: TValue) {
		this.scheduler = scheduler
		this.fetcher = fetcher
		this.frequencyInMilliseconds = frequencyInMilliseconds
		this.lastKnownGood = defaultValue
		this.outstandingFetch = this.fetch()
	}

	public get cached(): TValue { return this.lastKnownGood }
	public get latest(): Promise<TValue> { return this.outstandingFetch || this.fetch() }

	public registerListener = (listener: (newValue: TValue, oldValue: TValue) => void): void => {
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
			this.lastKnownGood = await this.outstandingFetch
			this.outstandingFetch = null
			this.listeners.forEach(listener => listener(this.lastKnownGood, previousValue))
			return this.lastKnownGood
		} finally {
			this.scheduledTaskId = this.scheduler.schedule(this.frequencyInMilliseconds, this.fetch)
		}
	}
}
