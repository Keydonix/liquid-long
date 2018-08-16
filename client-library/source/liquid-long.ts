import { LiquidLong as LiquidLongContract } from './generated/liquid-long'
import { LiquidLongDependenciesEthers, Provider } from './liquid-long-ethers-impl'
import { Scheduler } from './scheduler'
import { PolledValue } from './polled-value'
import { BigNumber, bigNumberify } from 'ethers/utils'

export class LiquidLong {
	private readonly contract: LiquidLongContract<BigNumber>
	private readonly ethPriceInUsd: PolledValue<number>
	private readonly providerFeeRate: PolledValue<number>
	public readonly awaitReady: Promise<void>

	public constructor(scheduler: Scheduler, provider: Provider, liquidLongAddress: string, defaultEthPriceInUsd: number, defaultProviderFeeRate: number, ethPricePollingFrequency: number = 10000, providerFeePollingFrequency: number = 10000) {
		this.contract = new LiquidLongContract(new LiquidLongDependenciesEthers(provider), liquidLongAddress, bigNumberify(1e9))
		this.ethPriceInUsd = new PolledValue(scheduler, this.fetchEthPriceInUsd, ethPricePollingFrequency, defaultEthPriceInUsd)
		this.providerFeeRate = new PolledValue(scheduler, this.fetchProviderFeeRate, providerFeePollingFrequency, defaultProviderFeeRate)
		this.awaitReady = Promise.all([this.ethPriceInUsd.latest, this.providerFeeRate.latest]).then(() => {})
	}

	public shutdown = async (): Promise<void> => {
		await Promise.all([
			this.ethPriceInUsd.shutdown(),
			this.providerFeeRate.shutdown(),
		])
	}

	public registerForEthPriceUpdated = (listener: (newEthPriceInUsd: number) => void): void => {
		this.ethPriceInUsd.registerListener(listener)
	}

	public getEthPriceInUsd = async (): Promise<number> => {
		return await this.ethPriceInUsd.cached
	}

	public getLiquidationPriceInUsd = async (leverageMultiplier: number): Promise<number> => {
		const ethPrice = await this.ethPriceInUsd.cached
		const liquidationAsPercentOfPrice =  1.5 - 1.5 / leverageMultiplier
		return ethPrice * liquidationAsPercentOfPrice
	}

	public getFuturePriceInUsdForPercentChange = async (percentChangeFromCurrent: number, leverageMultiplier: number): Promise<number> => {
		const ethPrice = await this.ethPriceInUsd.cached
		return ethPrice * (1 + percentChangeFromCurrent / leverageMultiplier)
	}

	public getPercentageChangeForFuturePrice = async (futurePriceInUsd: number, leverageMultiplier: number): Promise<number> => {
		const ethPrice = await this.ethPriceInUsd.cached
		return leverageMultiplier * (futurePriceInUsd / ethPrice - 1)
	}

	public getPositionValueInUsdAtFuturePrice = async (futurePriceInUsd: number, leverageMultiplier: number, leverageSizeInEth: number): Promise<number> => {
		const percentageChange = await this.getPercentageChangeForFuturePrice(futurePriceInUsd, leverageMultiplier)
		const ethAtPrice = leverageSizeInEth + leverageSizeInEth * percentageChange
		return ethAtPrice * await this.ethPriceInUsd.cached
	}

	public getChangeInPositionValueInUsdAtFuturePrice = async (futurePriceInUsd: number, leverageMultiplier: number, leverageSizeInEth: number): Promise<number> => {
		const currentPositionValueInUsd = await this.getPositionValueInUsdAtFuturePrice(await this.ethPriceInUsd.cached, leverageMultiplier, leverageSizeInEth)
		const futurePositionValueInUsd = await this.getChangeInPositionValueInUsdAtFuturePrice(await this.ethPriceInUsd.cached, leverageMultiplier, leverageSizeInEth)
		return futurePositionValueInUsd - currentPositionValueInUsd
	}

	public getFeeInEth = async (leverageMultiplier: number, leverageSizeInEth: number): Promise<number> => {
		const providerFeeRate = await this.providerFeeRate.cached
		const loanInEth = this.getLoanSizeInEth(leverageMultiplier, leverageSizeInEth)
		const feeInEth = loanInEth * providerFeeRate
		return feeInEth
	}

	public getEstimatedCostsInEth = async (leverageMultiplier: number, leverageSizeInEth: number): Promise<{low: number, high: number}> => {
		const daiPerEth = this.ethPriceInUsd.cached
		const loanSizeInEth = this.getLoanSizeInEth(leverageMultiplier, leverageSizeInEth)
		const daiToSell = loanSizeInEth * daiPerEth
		const attodaiToSell = bigNumberify(daiToSell * 1e9).mul(1e9)
		const result = await this.contract.estimateDaiSaleProceeds_(attodaiToSell)
		const daiSaleProceedsInEth = result._wethBought.div(1e9).toNumber() / 1e9
		const estimatedCostInEth = loanSizeInEth - daiSaleProceedsInEth
		const low = estimatedCostInEth
		const high = (low > 0) ? low * 2 : 0
		return { low, high }
	}

	public openPosition = async (leverageMultiplier: number, leverageSizeInEth: number, costLimitInEth: number, feeLimitInEth: number): Promise<void> => {
		const leverageMultiplierInPercents = bigNumberify(Math.round(leverageMultiplier * 100))
		const leverageSizeInAttoeth = bigNumberify(leverageSizeInEth * 1e18)
		const allowedFeeInAttoeth = bigNumberify(feeLimitInEth * 1e18)
		const affiliateFeeInAttoeth = bigNumberify(0)
		const affiliateAddress = '0x0000000000000000000000000000000000000000'
		await this.contract.openCdp(leverageMultiplierInPercents, leverageSizeInAttoeth, allowedFeeInAttoeth, affiliateFeeInAttoeth, affiliateAddress)
	}

	private fetchEthPriceInUsd = async (): Promise<number> => {
		const attousd = await this.contract.ethPriceInUsd_()
		return attousd.div(1e9).toNumber() / 1e9
	}

	private fetchProviderFeeRate = async (): Promise<number> => {
		const providerFeeAttoethPerEth = await this.contract.providerFeePerEth_()
		return providerFeeAttoethPerEth.div(1e9).toNumber() / 1e9
	}

	private getLoanSizeInEth = (leverageMultiplier: number, leverageSizeInEth: number): number => {
		const ethLockedInCdp = leverageSizeInEth * leverageMultiplier
		const loanInEth = ethLockedInCdp - leverageSizeInEth
		return loanInEth
	}
}

// https://github.com/nodejs/promise-use-cases/issues/27 current behavior of node is dumb, this fixes that
// process.on('unhandledRejection', e => { /* swallow error */ })