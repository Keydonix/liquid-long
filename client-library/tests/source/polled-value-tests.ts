import 'mocha'
import { expect } from 'chai'
import { PolledValue } from '@keydonix/liquid-long-client-library/source/polled-value'
import { MockScheduler } from './mock-scheduler';

describe('PolledValue', async () => {
	let scheduler: MockScheduler
	let polledNumber: PolledValue<number>

	beforeEach(async () => {
		scheduler = new MockScheduler()
	})

	afterEach(async () => {
		scheduler.cancelAll()
	})

	it('should return provided default immediately', async () => {
		polledNumber = new PolledValue(scheduler, async () => { await scheduler.delay(1); return 5 }, 2, 3)
		expect(polledNumber.cached).to.equal(3)
	})

	it('should fetch immediately when instantiated', async () => {
		polledNumber = new PolledValue(scheduler, async () => { await scheduler.delay(1); return 5 }, 2, 3)
		expect(polledNumber.cached).to.equal(3)
		// we must wait 1 millisecond for the fetcher to return
		await scheduler.moveTimeForward(1)
		expect(polledNumber.cached).to.equal(5)
	})

	it('should update when polled again', async () => {
		const defaultValue = 1
		let returnedValue = defaultValue
		polledNumber = new PolledValue(scheduler, async () => { await scheduler.delay(1); return ++returnedValue }, 2, defaultValue)
		expect(polledNumber.cached).to.equal(1)
		await scheduler.moveTimeForward(1)
		// initial fetch was kicked off immediately, but the fetch takes 1 millisecond so it should have updated by now
		expect(polledNumber.cached).to.equal(2)
		await scheduler.moveTimeForward(1)
		// polling interval is 2 milliseconds and was started when first fetch completed, so not time to fetch again yet
		expect(polledNumber.cached).to.equal(2)
		await scheduler.moveTimeForward(1)
		// 2 milliseconds has passed since first fetch completed, which triggers fetcher, but the fetch is not instantaneous so cached value not yet updated
		expect(polledNumber.cached).to.equal(2)
		await scheduler.moveTimeForward(1)
		// finally the fetcher function returns and we have the next value
		expect(polledNumber.cached).to.equal(3)
	})
})
