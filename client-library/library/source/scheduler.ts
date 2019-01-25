export abstract class Scheduler {
	public delay = (milliseconds: number): Promise<void> => {
		return new Promise<void>(resolve => {
			this.schedule(milliseconds, () => resolve())
		})
	}
	abstract schedule: (milliseconds: number, scheduledTask: () => void) => any
	abstract cancel: (scheduledTaskId: any) => void
	abstract cancelAll: () => void
}

// these declarations have slightly different signatures in Browser and Node, so we declare a version here that is a union of both and hope for the best
declare namespace NodeJS { export interface Timer { ref(): void; unref(): void; } }
type Timerish = number | NodeJS.Timer
declare function setTimeout(handler: Function, timeout?: number, ...arguments: any[]): Timerish;
declare function clearTimeout(handle?: Timerish): void;

export class TimeoutScheduler extends Scheduler {
	private readonly scheduledTaskIds = new Set<Timerish>()

	public schedule = (milliseconds: number, scheduledTask: () => void): Timerish => {
		let scheduledTaskId: Timerish
		scheduledTaskId = setTimeout(() => { this.scheduledTaskIds.delete(scheduledTaskId); scheduledTask() }, milliseconds)
		this.scheduledTaskIds.add(scheduledTaskId)
		return scheduledTaskId
	}

	public cancel = (scheduledTaskId: Timerish): void => {
		clearTimeout(scheduledTaskId)
		this.scheduledTaskIds.delete(scheduledTaskId)
	}

	public cancelAll = (): void => {
		this.scheduledTaskIds.forEach(scheduledTaskId => clearTimeout(scheduledTaskId))
	}
}
