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

	it('cached value should trigger fetch at first', async () => {
		let fetcherCalled = false
		const fetcher = async () => { fetcherCalled = true; await scheduler.delay(1); return 3 }
		polledNumber = new PolledValue(scheduler, fetcher, 2)
		expect(fetcherCalled).to.be.true
	})

	it('should fetch immediately when instantiated', async () => {
		polledNumber = new PolledValue(scheduler, async () => { await scheduler.delay(1); return 5 }, 2)
		// we must wait 1 millisecond for the fetcher to return
		await scheduler.moveTimeForward(1)
		expect(await polledNumber.cached).to.equal(5)
	})

	it('should update when polled again', async () => {
		let returnedValue = 1
		polledNumber = new PolledValue(scheduler, async () => { await scheduler.delay(1); return ++returnedValue }, 2)
		await scheduler.moveTimeForward(1)
		// initial fetch was kicked off immediately, but the fetch takes 1 millisecond so it should have updated by now
		expect(await polledNumber.cached).to.equal(2)
		await scheduler.moveTimeForward(1)
		// polling interval is 2 milliseconds and was started when first fetch completed, so not time to fetch again yet
		expect(await polledNumber.cached).to.equal(2)
		await scheduler.moveTimeForward(1)
		// 2 milliseconds has passed since first fetch completed, which triggers fetcher, but the fetch is not instantaneous so cached value not yet updated
		expect(await polledNumber.cached).to.equal(2)
		await scheduler.moveTimeForward(1)
		// finally the fetcher function returns and we have the next value
		expect(await polledNumber.cached).to.equal(3)
	})
})
