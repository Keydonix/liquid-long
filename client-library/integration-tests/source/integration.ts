require('source-map-support').install()

import 'mocha'
import { expect } from 'chai'
import { LiquidLong, TimeoutScheduler, JsonRpcProvider, Scheduler, Provider, Signer } from '@keydonix/liquid-long-client-library'

describe('liquid long tests', async () => {
	let ethereumAddress: string
	let liquidLongAddress: string
	before(async () => {
		if (!process.env.ETHEREUM_HTTP) throw new Error(`ETHEREUM_HTTP environment variable must be defined`)
		ethereumAddress = process.env.ETHEREUM_HTTP
		if (!process.env.ETHEREUM_LIQUID_LONG_ADDRESS) throw new Error(`ETHEREUM_LIQUID_LONG_ADRESS environment variable must be defined`)
		liquidLongAddress = process.env.ETHEREUM_LIQUID_LONG_ADDRESS

		await spinUntilNodeIsReady(ethereumAddress, liquidLongAddress)
	})

	let scheduler: Scheduler
	let provider: Provider
	let signer: Signer
	let liquidLong: LiquidLong
	beforeEach(async () => {
		scheduler = new TimeoutScheduler()
		provider = new JsonRpcProvider(ethereumAddress, 4173)
		signer = (<JsonRpcProvider>provider).getSigner(0)
		liquidLong = new LiquidLong(scheduler, provider, signer, liquidLongAddress, 0, 0.01)
		await liquidLong.awaitReady
	})

	afterEach(async () => {
		await liquidLong.shutdown()
	})

	describe('getEthPriceInUsd', async () => {
		it('should return baked in price of 600', async () => {
			const price = await liquidLong.getEthPriceInUsd()

			expect(price).to.equal(600)
		})
	})

	describe('openPosition', async () => {
		beforeEach(async () => {
			await liquidLong.adminDepositEth(100)
		})
		afterEach(async () => {
			await liquidLong.adminWithdrawEth(100)
		})
		it('should be able to open an unleveraged position', async () => {
			await liquidLong.openPosition(1, 1, 1, 1)
		})
	})
})

async function spinUntilNodeIsReady(ethereumAddress: string, liquidLongAddress: string): Promise<void> {
	console.log('waiting for node to get into a reasonable state...')
	const provider = new JsonRpcProvider(ethereumAddress, 4173)
	// spin until the provider returns a reasonable value
	const scheduler = new TimeoutScheduler()
	while (true) {
		try {
			// 0xfa72c53e: providerFeePerEth()
			if (await provider.call({ to: liquidLongAddress, data: '0xfa72c53e' }) !== '0x') break
		} catch (error) {
			scheduler.delay(100)
		}
	}
	console.log('node is in a reasonable state, tests starting')
}
