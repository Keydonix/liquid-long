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

export class TimeoutScheduler extends Scheduler {
	private readonly scheduledTaskIds = new Set<NodeJS.Timer>()
	private stopped = false

	public schedule = (milliseconds: number, scheduledTask: () => void): NodeJS.Timer => {
		let scheduledTaskId: NodeJS.Timer
		scheduledTaskId = setTimeout(() => { this.scheduledTaskIds.delete(scheduledTaskId); scheduledTask() }, milliseconds)
		this.scheduledTaskIds.add(scheduledTaskId)
		return scheduledTaskId
	}

	public cancel = (scheduledTaskId: NodeJS.Timer): void => {
		clearTimeout(scheduledTaskId)
		this.scheduledTaskIds.delete(scheduledTaskId)
	}

	public cancelAll = (): void => {
		this.scheduledTaskIds.forEach(scheduledTaskId => clearTimeout(scheduledTaskId))
	}
}
