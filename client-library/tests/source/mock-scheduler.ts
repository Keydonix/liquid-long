import { Scheduler } from '@keydonix/liquid-long-client-library/source/scheduler'

function delay(milliseconds: number): Promise<void> {
	return new Promise(resolve => setTimeout(() => resolve(), milliseconds))
}

export class MockScheduler extends Scheduler {
	private currentTime = 0
	private readonly delayedCalls = new Map<number, { callback: () => void, when: number }>()
	private nextId = 0

	public schedule = (milliseconds: number, callback: () => void): number => {
		const timerId = this.nextId++
		this.delayedCalls.set(timerId, { callback: callback, when: this.currentTime + milliseconds })
		return timerId
	}

	public cancel = (timerId: number): void => {
		this.delayedCalls.delete(timerId)
	}

	public cancelAll = (): void => {
		this.delayedCalls.clear()
	}

	public moveTimeForward = async (milliseconds: number, stepSize: number = 1): Promise<void> => {
		const targetTime = this.currentTime + milliseconds
		while (this.currentTime < targetTime) {
			this.currentTime += stepSize
			const firedTimerIds: Array<number> = []
			this.delayedCalls.forEach((value, timerId) => {
				if (value.when > this.currentTime) return
				try {
					value.callback()
				} catch (error) {
					console.error(error)
				}
				firedTimerIds.push(timerId)
			})
			firedTimerIds.forEach(timerId => this.delayedCalls.delete(timerId))
		}
		// we do this so that any resolved promises will trigger
		await delay(0)
	}
}
