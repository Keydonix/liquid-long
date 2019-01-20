import { LiquidLong as LiquidLongContract } from './generated/liquid-long'
import { ContractDependenciesEthers, Provider, Signer } from './liquid-long-ethers-impl'
import { Scheduler, TimeoutScheduler } from './scheduler'
import { PolledValue } from './polled-value'
import { parseHexInt } from './utils'
import { ethers } from 'ethers'


export class LiquidLong {
	private readonly contract: LiquidLongContract<ethers.utils.BigNumber>
	private readonly maxLeverageSizeInEth: PolledValue<number>
	private readonly ethPriceInUsd: PolledValue<number>
	private readonly providerFeeRate: PolledValue<number>
	public readonly awaitReady: Promise<void>

	static createWeb3(web3Provider: ethers.providers.AsyncSendable, liquidLongAddress: string, defaultEthPriceInUsd: number, defaultProviderFeeRate: number, defaultGasPriceInNanoeth: number, web3PollingInterval: number, ethPricePollingFrequency?: number, serviceFeePollingFrequency?: number): LiquidLong {
		const scheduler = new TimeoutScheduler()
		const provider = new ethers.providers.Web3Provider(web3Provider)
		const signer = provider.getSigner(0)
		provider.pollingInterval = web3PollingInterval
		return new LiquidLong(scheduler, provider, signer, liquidLongAddress, defaultEthPriceInUsd, defaultProviderFeeRate, defaultGasPriceInNanoeth, ethPricePollingFrequency, serviceFeePollingFrequency)
	}

	static createJsonRpc(jsonRpcAddress: string, liquidLongAddress: string, defaultEthPriceInUsd: number, defaultProviderFeeRate: number, defaultGasPriceInNanoeth: number, jsonRpcPollingInterval: number, ethPricePollingFrequency?: number, serviceFeePollingFrequency?: number): LiquidLong {
		const scheduler = new TimeoutScheduler()
		const provider = new ethers.providers.JsonRpcProvider(jsonRpcAddress);
		const signer = provider.getSigner(0)
		provider.pollingInterval = jsonRpcPollingInterval
		return new LiquidLong(scheduler, provider, signer, liquidLongAddress, defaultEthPriceInUsd, defaultProviderFeeRate, defaultGasPriceInNanoeth, ethPricePollingFrequency, serviceFeePollingFrequency)
	}

	public constructor(scheduler: Scheduler, provider: Provider, signer: Signer, liquidLongAddress: string, defaultEthPriceInUsd: number, defaultProviderFeeRate: number, defaultGasPriceInNanoeth: number, ethPricePollingFrequency: number = 10000, providerFeePollingFrequency: number = 10000) {
		const contractDependencies = new ContractDependenciesEthers(provider, signer, async () => defaultGasPriceInNanoeth)
		this.contract = new LiquidLongContract(contractDependencies, liquidLongAddress)
		this.maxLeverageSizeInEth = new PolledValue(scheduler, this.fetchMaxLeverageSizeInEth, ethPricePollingFrequency, 0)
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

	public registerForMaxLeverageSizeUpdate = (listener: (newMaxLeverageSize: number) => void): void => {
		this.maxLeverageSizeInEth.registerListener(listener)
	}

	public registerForEthPriceUpdated = (listener: (newEthPriceInUsd: number) => void): void => {
		this.ethPriceInUsd.registerListener(listener)
	}

	public getMaxLeverageSizeInEth = async (): Promise<number> => {
		return await this.maxLeverageSizeInEth.cached
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
		const futurePositionValueInUsd =  await this.getPositionValueInUsdAtFuturePrice(futurePriceInUsd, leverageMultiplier, leverageSizeInEth)
		return futurePositionValueInUsd - currentPositionValueInUsd
	}

	public getFeeInEth = async (leverageMultiplier: number, leverageSizeInEth: number): Promise<number> => {
		const providerFeeRate = await this.providerFeeRate.cached
		const loanInEth = this.getLoanSizeInEth(leverageMultiplier, leverageSizeInEth)
		const feeInEth = loanInEth * providerFeeRate
		return feeInEth
	}

	// TODO verify this math with a run through of a liquidation
	public getLiquidationPenaltyPercent = (leverageMultiplier: number): number => {
		const liquidationAsPercentOfPrice = 1.5 - 1.5 / leverageMultiplier
		return leverageMultiplier * (liquidationAsPercentOfPrice * (1 - 0.13 / leverageMultiplier) - 1)
	}

	public getEstimatedCostsInEth = async (leverageMultiplier: number, leverageSizeInEth: number): Promise<{low: number, high: number}> => {
		const daiPerEth = this.ethPriceInUsd.cached
		const loanSizeInEth = this.getLoanSizeInEth(leverageMultiplier, leverageSizeInEth)
		const daiToSell = loanSizeInEth * daiPerEth
		const attodaiToSell = ethers.utils.bigNumberify(Math.floor(daiToSell * 1e9)).mul(1e9)
		const result = await this.contract.estimateDaiSaleProceeds_(attodaiToSell)
		const daiSaleProceedsInEth = result._wethBought.div(1e9).toNumber() / 1e9
		const estimatedCostInEth = loanSizeInEth - daiSaleProceedsInEth
		const low = Math.max(estimatedCostInEth, loanSizeInEth * 0.01)
		const high = Math.max(low * 2, loanSizeInEth * 0.05)
		return { low, high }
	}

	public openPosition = async (leverageMultiplier: number, leverageSizeInEth: number, costLimitInEth: number, feeLimitInEth: number, affiliateAddress?: string): Promise<number> => {
		const leverageMultiplierInPercents = ethers.utils.bigNumberify(Math.round(leverageMultiplier * 100))
		const leverageSizeInAttoeth = ethers.utils.bigNumberify(Math.round(leverageSizeInEth * 1e9)).mul(1e9)
		const allowedCostInAttoeth = ethers.utils.bigNumberify(Math.round(costLimitInEth * 1e9)).mul(1e9)
		const allowedFeeInAttoeth = ethers.utils.bigNumberify(Math.round(feeLimitInEth * 1e9)).mul(1e9)
		const totalAttoeth = leverageSizeInAttoeth.add(allowedCostInAttoeth).add(allowedFeeInAttoeth)
		affiliateAddress = LiquidLong.validateAndNormalizeAffiliateAddress(affiliateAddress || '0000000000000000000000000000000000000000')
		const events = await this.contract.openCdp(leverageMultiplierInPercents, leverageSizeInAttoeth, allowedFeeInAttoeth, affiliateAddress, { attachedEth: totalAttoeth })
		const newCupEvent = <{ name: 'NewCup', parameters: {user: string, cup: string } }>events.find(x => x.name === 'NewCup')
		if (!newCupEvent) throw new Error(`Expected 'newCup' event when calling 'openCdp' but no such event found.`)
		if (!newCupEvent.parameters || !newCupEvent.parameters.user) throw new Error(`Unexpected contents for the 'newCup' event.\n${newCupEvent}`)
		return parseHexInt(newCupEvent.parameters.cup)
	}

	public adminDepositEth = async (amount: number): Promise<void> => {
		await this.contract.wethDeposit({ attachedEth: ethers.utils.bigNumberify(Math.round(amount * 1e9)).mul(1e9) })
	}

	public adminWithdrawWeth = async (amount: number): Promise<void> => {
		await this.contract.wethWithdraw(ethers.utils.bigNumberify(Math.round(amount * 1e9)).mul(1e9))
	}

	public adminTransferOwnership = async (newOwner: string): Promise<void> => {
		await this.contract.transferOwnership(newOwner)
	}

	public adminAcceptOwnership = async (): Promise<void> => {
		await this.contract.claimOwnership()
	}

	private fetchMaxLeverageSizeInEth = async (): Promise<number> => {
		const attoweth = await this.contract.attowethBalance_()
		return attoweth.div(2).div(1e9).toNumber() / 1e9
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

	static validateAndNormalizeAffiliateAddress = (affiliateAddress: string): string => {
		const match = /^(?:0x)?([a-fA-F0-9]{40})$/.exec(affiliateAddress)
		if (!match) throw new Error(`Invalid affiliate address: ${affiliateAddress}`)
		return match[1]
	}
}

// https://github.com/nodejs/promise-use-cases/issues/27 current behavior of node is dumb, this fixes that
// process.on('unhandledRejection', e => { /* swallow error */ })
