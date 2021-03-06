import { LiquidLong as LiquidLongContract, Address } from './generated/liquid-long.js'
import { ContractDependenciesEthers, Provider, Signer, CloseDelegatingContractDependenciesEthers } from './liquid-long-ethers-impl.js'
import { Scheduler, TimeoutScheduler } from './scheduler.js'
import { PolledValue } from './polled-value.js'
import { ethers } from 'ethers'


export class LiquidLong {
	private readonly contractAddress: Address
	private readonly contractDependencies: ContractDependenciesEthers
	private readonly contract: LiquidLongContract<ethers.utils.BigNumber>
	private readonly maxLeverageSizeInEth: PolledValue<number>
	private readonly ethPriceInUsd: PolledValue<number>
	private readonly providerFeeRate: PolledValue<number>
	public readonly awaitReady: Promise<void>

	static createWeb3(web3Provider: ethers.providers.AsyncSendable, liquidLong: Address, getGasPriceInNanoeth: () => Promise<number|undefined>, web3PollingInterval: number, ethPricePollingFrequency?: number, serviceFeePollingFrequency?: number): LiquidLong {
		const scheduler = new TimeoutScheduler()
		const provider = new ethers.providers.Web3Provider(web3Provider)
		const signer = provider.getSigner(0)
		provider.pollingInterval = web3PollingInterval
		return new LiquidLong(scheduler, provider, signer, liquidLong, getGasPriceInNanoeth, ethPricePollingFrequency, serviceFeePollingFrequency)
	}

	static createJsonRpc(jsonRpcUrl: string, liquidLong: Address, getGasPriceInNanoeth: () => Promise<number|undefined>, jsonRpcPollingInterval: number, ethPricePollingFrequency?: number, serviceFeePollingFrequency?: number): LiquidLong {
		const scheduler = new TimeoutScheduler()
		const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
		const signer = provider.getSigner(0)
		provider.pollingInterval = jsonRpcPollingInterval
		return new LiquidLong(scheduler, provider, signer, liquidLong, getGasPriceInNanoeth, ethPricePollingFrequency, serviceFeePollingFrequency)
	}

	public constructor(scheduler: Scheduler, provider: Provider, signer: Signer, liquidLong: Address, getGasPriceInNanoeth: () => Promise<number|undefined>, ethPricePollingFrequency: number = 10000, providerFeePollingFrequency: number = 10000) {
		this.contractAddress = liquidLong
		this.contractDependencies = new ContractDependenciesEthers(provider, signer, getGasPriceInNanoeth)
		this.contract = new LiquidLongContract(this.contractDependencies, liquidLong)
		this.maxLeverageSizeInEth = new PolledValue(scheduler, this.fetchMaxLeverageSizeInEth, ethPricePollingFrequency)
		this.ethPriceInUsd = new PolledValue(scheduler, this.fetchEthPriceInUsd, ethPricePollingFrequency)
		this.providerFeeRate = new PolledValue(scheduler, this.fetchProviderFeeRate, providerFeePollingFrequency)
		this.awaitReady = Promise.all([this.ethPriceInUsd.latest, this.providerFeeRate.latest]).then(() => {})
	}

	public readonly shutdown = async (): Promise<void> => {
		await Promise.all([
			this.ethPriceInUsd.shutdown(),
			this.providerFeeRate.shutdown(),
		])
	}

	public readonly registerForMaxLeverageSizeUpdate = (listener: (newMaxLeverageSize: number) => void): void => {
		this.maxLeverageSizeInEth.registerListener(listener)
	}

	public readonly registerForEthPriceUpdated = (listener: (newEthPriceInUsd: number) => void): void => {
		this.ethPriceInUsd.registerListener(listener)
	}

	public readonly getMaxLeverageSizeInEth = async (): Promise<number> => {
		return await this.maxLeverageSizeInEth.cached
	}

	public readonly getEthPriceInUsd = async (): Promise<number> => {
		return await this.ethPriceInUsd.cached
	}

	public readonly getLiquidationPriceInUsd = async (leverageMultiplier: number): Promise<number> => {
		const ethPrice = await this.ethPriceInUsd.cached
		const liquidationAsPercentOfPrice =  1.5 - 1.5 / leverageMultiplier
		return ethPrice * liquidationAsPercentOfPrice
	}

	public readonly getFuturePriceInUsdForPercentChange = async (percentChangeFromCurrent: number, leverageMultiplier: number): Promise<number> => {
		const ethPrice = await this.ethPriceInUsd.cached
		return ethPrice * (1 + percentChangeFromCurrent / leverageMultiplier)
	}

	public readonly getPercentageChangeForFuturePrice = async (futurePriceInUsd: number, leverageMultiplier: number): Promise<number> => {
		const ethPrice = await this.ethPriceInUsd.cached
		return leverageMultiplier * (futurePriceInUsd / ethPrice - 1)
	}

	public readonly getPositionValueInUsdAtFuturePrice = async (futurePriceInUsd: number, leverageMultiplier: number, leverageSizeInEth: number): Promise<number> => {
		const percentageChange = await this.getPercentageChangeForFuturePrice(futurePriceInUsd, leverageMultiplier)
		const ethAtPrice = leverageSizeInEth + leverageSizeInEth * percentageChange
		return ethAtPrice * await this.ethPriceInUsd.cached
	}

	public readonly getChangeInPositionValueInUsdAtFuturePrice = async (futurePriceInUsd: number, leverageMultiplier: number, leverageSizeInEth: number): Promise<number> => {
		const currentPositionValueInUsd = await this.getPositionValueInUsdAtFuturePrice(await this.ethPriceInUsd.cached, leverageMultiplier, leverageSizeInEth)
		const futurePositionValueInUsd =  await this.getPositionValueInUsdAtFuturePrice(futurePriceInUsd, leverageMultiplier, leverageSizeInEth)
		return futurePositionValueInUsd - currentPositionValueInUsd
	}

	public readonly getFeeInEth = async (leverageMultiplier: number, leverageSizeInEth: number): Promise<number> => {
		const providerFeeRate = await this.providerFeeRate.cached
		const loanInEth = this.getLoanSizeInEth(leverageMultiplier, leverageSizeInEth)
		const feeInEth = loanInEth * providerFeeRate
		return feeInEth
	}

	// TODO verify this math with a run through of a liquidation
	public readonly getLiquidationPenaltyPercent = (leverageMultiplier: number): number => {
		const liquidationAsPercentOfPrice = 1.5 - 1.5 / leverageMultiplier
		return leverageMultiplier * (liquidationAsPercentOfPrice * (1 - 0.13 / leverageMultiplier) - 1)
	}

	public readonly getEstimatedCostsInEth = async (leverageMultiplier: number, leverageSizeInEth: number): Promise<{low: number, high: number}> => {
		const daiPerEth = await this.ethPriceInUsd.cached
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

	/**
	 * @returns null when there is not enough ETH available to buy with DAI on market
	 */
	public readonly tryGetEstimatedCloseYieldInEth = async (cdpOwner: Address, cdpId: number): Promise<number> => {
		const delegatedContract = this.getSingleUseCloseDelegator(cdpOwner)
		const estimatedYieldInAttoeth = await delegatedContract.closeCdp_(this.contractAddress, ethers.utils.bigNumberify(cdpId), ethers.utils.bigNumberify(0), new Address())
		return estimatedYieldInAttoeth.div(1e9).toNumber() / 1e9
	}

	public readonly getPositions = async (holder: Address): Promise<Array<Position>> => {
		const numberOfCdps = await this.contract.cdpCount_()
		const pageSize = 1000
		const positionPromises: Array<Promise<Array<Position>>> = []
		for (let i = 0; i < numberOfCdps; i += pageSize) {
			positionPromises.push(this.getPositionsChunk(holder, i, pageSize))
		}
		const positions = await Promise.all(positionPromises)
		return positions.reduce((accumulator, currentValue) => accumulator.concat(currentValue), [])
	}

	public readonly getPositionsChunk = async (holder: Address, offset: number, pageSize: number): Promise<Array<Position>> => {
		const pageOfCdps = await this.contract.getCdps_(holder, offset, pageSize)
		return pageOfCdps.map(cdp => ({
			id: cdp.id.toNumber(),
			collateralInEth: cdp.lockedAttoeth.div(1e9).toNumber() / 1e9,
			debtInDai: cdp.debtInAttodai.div(1e9).toNumber() / 1e9,
			owner: cdp.owner,
			proxied: !cdp.userOwned,
		}))
	}

	public readonly openPosition = async (leverageMultiplier: number, leverageSizeInEth: number, costLimitInEth: number, feeLimitInEth: number, affiliate?: Address): Promise<number> => {
		const leverageMultiplierInPercents = ethers.utils.bigNumberify(Math.round(leverageMultiplier * 100))
		const leverageSizeInAttoeth = ethers.utils.bigNumberify(Math.round(leverageSizeInEth * 1e9)).mul(1e9)
		const allowedCostInAttoeth = ethers.utils.bigNumberify(Math.round(costLimitInEth * 1e9)).mul(1e9)
		const allowedFeeInAttoeth = ethers.utils.bigNumberify(Math.round(feeLimitInEth * 1e9)).mul(1e9)
		const totalAttoeth = leverageSizeInAttoeth.add(allowedCostInAttoeth).add(allowedFeeInAttoeth)
		const affiliateAddress = affiliate || new Address()
		const events = await this.contract.openCdp(leverageMultiplierInPercents, leverageSizeInAttoeth, allowedFeeInAttoeth, affiliateAddress, totalAttoeth)
		const newCupEvent = <LiquidLongContract.NewCup<ethers.utils.BigNumber>>events.find(x => x.name === 'NewCup')
		if (!newCupEvent) throw new Error(`Expected 'newCup' event when calling 'openCdp' but no such event found.`)
		if (!newCupEvent.parameters || !newCupEvent.parameters.user || !newCupEvent.parameters.cup) throw new Error(`Unexpected contents for the 'NewCup' event.\n${newCupEvent}`)
		return newCupEvent.parameters.cup.toNumber()
	}

	public readonly closePosition = async (cdpOwner: Address, cdpId: number, minimumPayoutInEth: number, affiliate?: Address): Promise<void> => {
		const delegatedContract = this.getSingleUseCloseDelegator(cdpOwner)
		const minimumPayoutInAttoeth = ethers.utils.bigNumberify(Math.floor(minimumPayoutInEth * 1e9)).mul(1e9)
		const affiliateAddress = affiliate || new Address()
		const events = await delegatedContract.closeCdp(this.contractAddress, ethers.utils.bigNumberify(cdpId), minimumPayoutInAttoeth, affiliateAddress)
		const closeCupEvent = <LiquidLongContract.CloseCup<ethers.utils.BigNumber>>events.find(x => x.name === 'CloseCup')
		if (!closeCupEvent) throw new Error(`Expected 'closeCup' event when calling 'closeCdp' but no such event found.`)
		if (!closeCupEvent.parameters || !closeCupEvent.parameters.user) throw new Error(`Unexpected contents for the 'CloseCup' event.\n${closeCupEvent}`)
	}

	public readonly adminDepositEth = async (amount: number): Promise<void> => {
		const attachedAttoeth = ethers.utils.bigNumberify(Math.round(amount * 1e9)).mul(1e9)
		await this.contract.wethDeposit(attachedAttoeth)
	}

	public readonly adminWithdrawWeth = async (amount: number): Promise<void> => {
		await this.contract.wethWithdraw(ethers.utils.bigNumberify(Math.round(amount * 1e9)).mul(1e9))
	}

	public readonly adminWithdrawMkr = async (): Promise<void> => {
		await this.contract.transferTokens(await this.contract.mkr_())
	}

	public readonly adminTransferOwnership = async (newOwner: Address): Promise<void> => {
		await this.contract.transferOwnership(newOwner)
	}

	public readonly adminAcceptOwnership = async (): Promise<void> => {
		await this.contract.claimOwnership()
	}

	private readonly fetchMaxLeverageSizeInEth = async (): Promise<number> => {
		const attoweth = await this.contract.attowethBalance_()
		return attoweth.div(2).div(1e9).toNumber() / 1e9
	}

	private readonly fetchEthPriceInUsd = async (): Promise<number> => {
		const attousd = await this.contract.ethPriceInUsd_()
		return attousd.div(1e9).toNumber() / 1e9
	}

	private readonly fetchProviderFeeRate = async (): Promise<number> => {
		const providerFeeAttoethPerEth = await this.contract.providerFeePerEth_()
		return providerFeeAttoethPerEth.div(1e9).toNumber() / 1e9
	}

	private readonly getLoanSizeInEth = (leverageMultiplier: number, leverageSizeInEth: number): number => {
		const ethLockedInCdp = leverageSizeInEth * leverageMultiplier
		const loanInEth = ethLockedInCdp - leverageSizeInEth
		return loanInEth
	}

	private readonly getSingleUseCloseDelegator = (proxy: Address): LiquidLongContract<ethers.utils.BigNumber> => {
		const delegatingDependencies = new CloseDelegatingContractDependenciesEthers(this.contractDependencies, proxy)
		return new LiquidLongContract(delegatingDependencies, this.contractAddress)
	}
}

export interface Position {
	id: number,
	collateralInEth: number,
	debtInDai: number,
	owner: Address,
	proxied: boolean,
}

// https://github.com/nodejs/promise-use-cases/issues/27 current behavior of node is dumb, this fixes that
// process.on('unhandledRejection', e => { /* swallow error */ })
