import 'mocha'
import { expect } from 'chai'
import { LiquidLong, Address } from '@keydonix/liquid-long-client-library'
import { MockProvider } from './mock-provider'
import { MockScheduler } from './mock-scheduler';
import { MockSigner } from './mock-signer';

describe('LiquidLong', async () => {
	let mockScheduler: MockScheduler
	let mockProvider: MockProvider
	let mockSigner: MockSigner
	let liquidLong: LiquidLong

	beforeEach(async () => {
		mockScheduler = new MockScheduler()
		mockProvider = new MockProvider()
		mockSigner = new MockSigner()
		liquidLong = new LiquidLong(mockScheduler, mockProvider, mockSigner, new Address(), async () => 0, 0.01, 1)
	})

	afterEach(async () => {
		mockScheduler.cancelAll()
	})

	describe('getMaxLeverageSizeInEth', async () => {
		it('should return a floating point number that is half of available weth', async () => {
			mockProvider.setWethBalance(123.45)
			await mockScheduler.moveTimeForward(10000)

			const maxLeverage = await liquidLong.getMaxLeverageSizeInEth()

			expect(maxLeverage).to.equal(61.725)
		})
	})

	describe('getEthPrice', async () => {
		it('should return floating point number representation', async () => {
			mockProvider.setEthPriceInUsd(543.21)
			await mockScheduler.moveTimeForward(10000)

			const ethPriceInUsd = await liquidLong.getEthPriceInUsd()

			expect(ethPriceInUsd).to.equal(543.21)
		})
	})

	describe('getLiquidationPenaltyPercent', async () => {
		const tests = [
			{ percent: -1, multiplier: 1 },
			{ percent: -0.8557, multiplier: 1.4 },
			{ percent: -0.815, multiplier: 1.5 },
			{ percent: -0.5975, multiplier: 2},
			{ percent: -0.367, multiplier: 2.5 },
			{ percent: -0.13, multiplier: 3},
		]
		tests.forEach(test => {
			it(`should return ${test.percent} percent for ${test.multiplier}x multiplier`, async () => {
				const liquidationPriceInUsd = liquidLong.getLiquidationPenaltyPercent(test.multiplier)

				expect(liquidationPriceInUsd).to.be.closeTo(test.percent, 0.001)
			})
		})
	})

	describe('getLiquidationPriceInUsd', async () => {
		it('should return floating point number representation', async () => {
			mockProvider.setEthPriceInUsd(543.21)
			await mockScheduler.moveTimeForward(10000)

			const liquidationPriceInUsd = await liquidLong.getLiquidationPriceInUsd(2)

			expect(liquidationPriceInUsd).to.equal(407.4075)
		})

		const tests = [
			{ liquidationPrice: 0, currentPrice: 1000, multiplier: 1 },
			{ liquidationPrice: 750, currentPrice: 1000, multiplier: 2 },
			{ liquidationPrice: 1000, currentPrice: 1000, multiplier: 3 },
			{ liquidationPrice: 0, currentPrice: 5, multiplier: 1},
			{ liquidationPrice: 3.75, currentPrice: 5, multiplier: 2},
			{ liquidationPrice: 5, currentPrice: 5, multiplier: 3},
		]
		tests.forEach(test => {
			it(`should return ${test.liquidationPrice} of price for ${test.multiplier}x multiplier and current price of ${test.currentPrice}`, async () => {
				mockProvider.setEthPriceInUsd(test.currentPrice)
				await mockScheduler.moveTimeForward(10000)

				const liquidationPriceInUsd = await liquidLong.getLiquidationPriceInUsd(test.multiplier)

				expect(liquidationPriceInUsd).to.equal(test.liquidationPrice)
			})
		})
	})

	describe('getFuturePriceForPercentChange', async () => {
		it('should return a floating point number representation', async () => {
			mockProvider.setEthPriceInUsd(543.21)
			await mockScheduler.moveTimeForward(10000)

			const targetPriceInUsd = await liquidLong.getFuturePriceInUsdForPercentChange(-0.5, 2)

			expect(targetPriceInUsd).to.equal(407.4075)
		})

		const tests = [
			{percent: -1.00, multiplier: 1, expectedFuturePrice:    0.000},
			{percent: -0.50, multiplier: 1, expectedFuturePrice:  250.000},
			{percent: -0.25, multiplier: 1, expectedFuturePrice:  375.000},
			{percent:  0.00, multiplier: 1, expectedFuturePrice:  500.000},
			{percent:  0.25, multiplier: 1, expectedFuturePrice:  625.000},
			{percent:  0.50, multiplier: 1, expectedFuturePrice:  750.000},
			{percent:  1.00, multiplier: 1, expectedFuturePrice: 1000.000},
			{percent: -1.00, multiplier: 2, expectedFuturePrice:  250.000},
			{percent: -0.50, multiplier: 2, expectedFuturePrice:  375.000},
			{percent: -0.25, multiplier: 2, expectedFuturePrice:  437.500},
			{percent:  0.00, multiplier: 2, expectedFuturePrice:  500.000},
			{percent:  0.25, multiplier: 2, expectedFuturePrice:  562.500},
			{percent:  0.50, multiplier: 2, expectedFuturePrice:  625.000},
			{percent:  1.00, multiplier: 2, expectedFuturePrice:  750.000},
			{percent: -1.00, multiplier: 3, expectedFuturePrice:  333.333},
			{percent: -0.50, multiplier: 3, expectedFuturePrice:  416.666},
			{percent: -0.25, multiplier: 3, expectedFuturePrice:  458.333},
			{percent:  0.00, multiplier: 3, expectedFuturePrice:  500.000},
			{percent:  0.25, multiplier: 3, expectedFuturePrice:  541.666},
			{percent:  0.50, multiplier: 3, expectedFuturePrice:  583.333},
			{percent:  1.00, multiplier: 3, expectedFuturePrice:  666.666},
		]
		tests.forEach(test => {
			it(`should return ${('       '+test.expectedFuturePrice.toFixed(3)).substr(-7)} when percent is ${('     '+test.percent.toFixed(2)).substr(-5)} and multiplier is ${test.multiplier}`, async () => {
				mockProvider.setEthPriceInUsd(500)
				await mockScheduler.moveTimeForward(10000)

				const targetPriceInUsd = await liquidLong.getFuturePriceInUsdForPercentChange(test.percent, test.multiplier)

				expect(targetPriceInUsd).to.be.closeTo(test.expectedFuturePrice, 0.001)
			})
		})
	})

	describe('getPercentageChangeForFuturePrice', async () => {
		it('should return a floating point number representation', async () => {
			mockProvider.setEthPriceInUsd(543.21)
			await mockScheduler.moveTimeForward(10000)

			const percentageChange = await liquidLong.getPercentageChangeForFuturePrice(407.4075, 2)

			expect(percentageChange).to.equal(-0.5)
		})

		const tests = [
			{futurePrice:    0.000, multiplier: 1, expectedPercentageChange: -1.00},
			{futurePrice:  250.000, multiplier: 1, expectedPercentageChange: -0.50},
			{futurePrice:  375.000, multiplier: 1, expectedPercentageChange: -0.25},
			{futurePrice:  500.000, multiplier: 1, expectedPercentageChange:  0.00},
			{futurePrice:  625.000, multiplier: 1, expectedPercentageChange:  0.25},
			{futurePrice:  750.000, multiplier: 1, expectedPercentageChange:  0.50},
			{futurePrice: 1000.000, multiplier: 1, expectedPercentageChange:  1.00},
			{futurePrice:  250.000, multiplier: 2, expectedPercentageChange: -1.00},
			{futurePrice:  375.000, multiplier: 2, expectedPercentageChange: -0.50},
			{futurePrice:  437.500, multiplier: 2, expectedPercentageChange: -0.25},
			{futurePrice:  500.000, multiplier: 2, expectedPercentageChange:  0.00},
			{futurePrice:  562.500, multiplier: 2, expectedPercentageChange:  0.25},
			{futurePrice:  625.000, multiplier: 2, expectedPercentageChange:  0.50},
			{futurePrice:  750.000, multiplier: 2, expectedPercentageChange:  1.00},
			{futurePrice:  333.333, multiplier: 3, expectedPercentageChange: -1.00},
			{futurePrice:  416.666, multiplier: 3, expectedPercentageChange: -0.50},
			{futurePrice:  458.333, multiplier: 3, expectedPercentageChange: -0.25},
			{futurePrice:  500.000, multiplier: 3, expectedPercentageChange:  0.00},
			{futurePrice:  541.666, multiplier: 3, expectedPercentageChange:  0.25},
			{futurePrice:  583.333, multiplier: 3, expectedPercentageChange:  0.50},
			{futurePrice:  666.666, multiplier: 3, expectedPercentageChange:  1.00},
		]
		tests.forEach(test => {
			it(`should return ${('     '+test.expectedPercentageChange.toFixed(2)).substr(-5)} when future price is ${('       '+test.futurePrice.toFixed(3)).substr(-7)} and multiplier is ${test.multiplier}`, async () => {
				mockProvider.setEthPriceInUsd(500)
				await mockScheduler.moveTimeForward(10000)

				const percentageChange = await liquidLong.getPercentageChangeForFuturePrice(test.futurePrice, test.multiplier)

				expect(percentageChange).to.be.closeTo(test.expectedPercentageChange, 0.001)
			})
		})
	})

	describe('getPositionValueAtFuturePrice', async () => {
		it('should return a floating point number representation', async () => {
			mockProvider.setEthPriceInUsd(543.21)
			await mockScheduler.moveTimeForward(10000)

			const percentageChange = await liquidLong.getPositionValueInUsdAtFuturePrice(407.4075, 2, 100)

			expect(percentageChange).to.equal(27160.5)
		})

		const tests = [
			{ futurePrice:    0.000, multiplier: 1, expectedPositionValue:      0 },
			{ futurePrice:  250.000, multiplier: 1, expectedPositionValue:  25000 },
			{ futurePrice:  375.000, multiplier: 1, expectedPositionValue:  37500 },
			{ futurePrice:  500.000, multiplier: 1, expectedPositionValue:  50000 },
			{ futurePrice:  625.000, multiplier: 1, expectedPositionValue:  62500 },
			{ futurePrice:  750.000, multiplier: 1, expectedPositionValue:  75000 },
			{ futurePrice: 1000.000, multiplier: 1, expectedPositionValue: 100000 },
			{ futurePrice:  250.000, multiplier: 2, expectedPositionValue:      0 },
			{ futurePrice:  375.000, multiplier: 2, expectedPositionValue:  25000 },
			{ futurePrice:  437.500, multiplier: 2, expectedPositionValue:  37500 },
			{ futurePrice:  500.000, multiplier: 2, expectedPositionValue:  50000 },
			{ futurePrice:  562.500, multiplier: 2, expectedPositionValue:  62500 },
			{ futurePrice:  625.000, multiplier: 2, expectedPositionValue:  75000 },
			{ futurePrice:  750.000, multiplier: 2, expectedPositionValue: 100000 },
			{ futurePrice:  333+1/3, multiplier: 3, expectedPositionValue:      0 },
			{ futurePrice:  416+2/3, multiplier: 3, expectedPositionValue:  25000 },
			{ futurePrice:  458+1/3, multiplier: 3, expectedPositionValue:  37500 },
			{ futurePrice:  500.000, multiplier: 3, expectedPositionValue:  50000 },
			{ futurePrice:  541+2/3, multiplier: 3, expectedPositionValue:  62500 },
			{ futurePrice:  583+1/3, multiplier: 3, expectedPositionValue:  75000 },
			{ futurePrice:  666+2/3, multiplier: 3, expectedPositionValue: 100000 },
		]
		tests.forEach(test => {
			it(`should return ${('      '+test.expectedPositionValue).substr(-6)} when future price is ${('       '+test.futurePrice.toFixed(3)).substr(-7)} and multiplier is ${test.multiplier}`, async () => {
				mockProvider.setEthPriceInUsd(500)
				await mockScheduler.moveTimeForward(10000)

				const percentageChange = await liquidLong.getPositionValueInUsdAtFuturePrice(test.futurePrice, test.multiplier, 100)

				expect(percentageChange).to.be.closeTo(test.expectedPositionValue, 0.001)
			})
		})
	})

	describe('getFeeInEth', async () => {
		it('should return a floating point number representation', async () => {
			mockProvider.setProviderFeePerEth(0.01)
			await mockScheduler.moveTimeForward(10000)

			const fee = await liquidLong.getFeeInEth(2, 1)

			expect(fee).to.equal(0.01)
		})

		const tests = [
			{ providerFeeRate: 0.01, leverageMultiplier: 2, leverageSize: 1, expectedFee: 0.01 },
			{ providerFeeRate: 0.02, leverageMultiplier: 2, leverageSize: 1, expectedFee: 0.02 },
			{ providerFeeRate: 0.01, leverageMultiplier: 1, leverageSize: 9, expectedFee: 0.00 },
			{ providerFeeRate: 0.01, leverageMultiplier: 3, leverageSize: 1, expectedFee: 0.02 },
			{ providerFeeRate: 0.01, leverageMultiplier: 3, leverageSize: 5, expectedFee: 0.10 },
			{ providerFeeRate: 0.01, leverageMultiplier: 1.5, leverageSize: 1, expectedFee: 0.005 },
		]
		tests.forEach(test => {
			it(`should return ${test.expectedFee} when fee rate is ${test.providerFeeRate}, leverage size is ${test.leverageSize} and leverage multiplier is ${test.leverageMultiplier}`, async () => {
				mockProvider.setProviderFeePerEth(test.providerFeeRate)
				await mockScheduler.moveTimeForward(10001)

				const fee = await liquidLong.getFeeInEth(test.leverageMultiplier, test.leverageSize)

				expect(fee).to.equal(test.expectedFee)
			})
		})
	})

	describe('getEstimatedCostsInEth', async () => {
		it('should return floating point number representation', async () => {
			mockProvider.setEthPriceInUsd(1000)
			mockProvider.setEthBoughtCost(0.9)
			await mockScheduler.moveTimeForward(10000)

			const { low, high } = await liquidLong.getEstimatedCostsInEth(2, 1)

			// TODO: validate that the contract is called with expected parameters
			expect(low).to.be.approximately(0.1, 0.0000001)
			expect(high).to.be.approximately(0.2, 0.0000001)
		})

		const tests = [
			{ feedPrice: 1000, oasisPrice: 900, leverageMultiplier: 2, leverageSize: 1, expectedLowEstimate: 0.1, expectedHighEstimate: 0.2 },
			{ feedPrice: 1000, oasisPrice: 1000, leverageMultiplier: 2, leverageSize: 1, expectedLowEstimate: 0.01, expectedHighEstimate: 0.05 },
			// TODO: at the moment the mock just returns a fixed value, it doesn't consider inputs, so the following won't work
			// { feedPrice: 1000, oasisPrice: 900, leverageMultiplier: 3, leverageSize: 1, expectedLowEstimate: 0.2, expectedHighEstimate: 0.4 },
			// { feedPrice: 1000, oasisPrice: 900, leverageMultiplier: 2, leverageSize: 2, expectedLowEstimate: 0.2, expectedHighEstimate: 0.4 },
			// { feedPrice: 1000, oasisPrice: 900, leverageMultiplier: 1, leverageSize: 1, expectedLowEstimate: 0.0, expectedHighEstimate: 0.0 },
		]
		tests.forEach(test => {
			it(`should return {${test.expectedLowEstimate}, ${test.expectedHighEstimate} when feed price is ${test.feedPrice}, oasis price is ${test.oasisPrice}, leverage size is ${test.leverageSize}, and leverage multiplier is ${test.leverageMultiplier}`, async () => {
				mockProvider.setEthPriceInUsd(test.feedPrice)
				mockProvider.setEthBoughtCost(test.oasisPrice / test.feedPrice)
				await mockScheduler.moveTimeForward(10000)

				const { low, high } = await liquidLong.getEstimatedCostsInEth(test.leverageMultiplier, test.leverageSize)

				// TODO: validate that the contract is called with expected parameters
				expect(low).to.be.approximately(test.expectedLowEstimate, 0.0000001)
				expect(high).to.be.approximately(test.expectedHighEstimate, 0.0000001)
			})
		})
	})

	describe('openPosition', async () => {
		it(`should resolve once transaction is mined with status of success`, async () => {
			// TODO
		})

		it(`should reject if transaction is mined and receipt has status of failure`, async () => {
			// TODO
		})

		it(`should not resolve until transaction is mined`, async () => {
			// TODO
		})

		it(`should reject if dependency rejects`, async () => {
			// TODO
		})

		it(`should reject if dependency throws`, async () => {
			// TODO
		})
	})
})
