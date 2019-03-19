require('source-map-support').install()

import 'mocha'
import { expect } from 'chai'
import { LiquidLong, Address } from '@keydonix/liquid-long-client-library'
import { TimeoutScheduler } from '@keydonix/liquid-long-client-library/output-node/scheduler';
import { Oasis, Sai, Gem, Tub, Pip, Bytes32, Gov } from '@keydonix/maker-contract-interfaces'
import { ContractDependenciesEthers } from './contract-dependencies'
import { getEnv } from './environment'
import { JsonRpcProvider } from 'ethers/providers'
import { Wallet } from 'ethers'
import { BigNumber, bigNumberify } from 'ethers/utils'

const QUINTILLION = bigNumberify(10).pow(18)

describe('liquid long tests', async () => {
	let ethereumAddress: string
	let privateKey: string
	let liquidLongAddress: Address
	let oasisAddress: Address
	let makerAddress: Address
	let wethAddress: Address
	let daiAddress: Address

	let provider: JsonRpcProvider
	let wallets: { funder: Wallet, owner: Wallet, user: Wallet, affiliate: Wallet }
	let liquidLong: { owner: LiquidLong, user: LiquidLong, affiliate: LiquidLong }
	let oasis: Oasis<BigNumber>
	let maker: Tub<BigNumber>
	let medianizer: Pip<BigNumber>
	let dai: Sai<BigNumber>
	let mkr: Gov<BigNumber>
	let weth: { owner: Gem<BigNumber>, user: Gem<BigNumber>, affiliate: Gem<BigNumber>}

	before(async () => {
		ethereumAddress = getEnv('ETHEREUM_HTTP', 'http://localhost:1235')
		privateKey = getEnv('ETHEREUM_PRIVATE_KEY', 'fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a')
		liquidLongAddress = Address.fromHexString(getEnv('ETHEREUM_LIQUID_LONG_ADDRESS', '0xB03CF72BC5A9A344AAC43534D664917927367487'))
		oasisAddress = Address.fromHexString(getEnv('ETHEREUM_OASIS_ADDRESS', '0x3c6721551c2ba3973560aef3e11d34ce05db4047'))
		wethAddress = Address.fromHexString(getEnv('ETHEREUM_WETH_ADRESS', '0xfcaf25bf38e7c86612a25ff18cb8e09ab07c9885'))
		makerAddress = Address.fromHexString(getEnv('ETHEREUM_TUB_ADRESS', '0x93943fb2d02ce1101dadc3ab1bc3cab723fd19d6'))
		daiAddress = Address.fromHexString(getEnv('ETHEREUM_DAI_ADDRESS', '0x8c915bd2c0df8ba79a7d28538500a97bd15ea985'))

		await spinUntilNodeIsReady(ethereumAddress, liquidLongAddress)

		provider = new JsonRpcProvider(ethereumAddress)
		provider.pollingInterval = 10
		wallets = {
			funder: new Wallet(privateKey).connect(provider),
			owner: new Wallet(privateKey).connect(provider),
			user: Wallet.fromMnemonic('emerge body soap morning knock unknown eyebrow mystery desert enrich noble come').connect(provider),
			affiliate: Wallet.fromMnemonic('fantasy fringe prosper bench jaguar sound corn course stick blade luggage wonder').connect(provider),
		}
		liquidLong = {
			owner: LiquidLong.createJsonRpc(ethereumAddress, liquidLongAddress, async () => 0, 10),
			user: new LiquidLong(new TimeoutScheduler(), provider, wallets.user, liquidLongAddress, async () => 0),
			affiliate: new LiquidLong(new TimeoutScheduler(), provider, wallets.affiliate, liquidLongAddress, async () => 0),
		}
		const ownerDependencies = new ContractDependenciesEthers(provider, provider.getSigner(0), async () => 0)
		const userDependencies = new ContractDependenciesEthers(provider, wallets.user, async () => 0)
		const affiliateDependencies = new ContractDependenciesEthers(provider, wallets.affiliate, async () => 0)
		// TODO: turn these into objects like weth
		oasis = new Oasis(ownerDependencies, oasisAddress)
		maker = new Tub(ownerDependencies, makerAddress)
		medianizer = new Pip(ownerDependencies, await maker.pip_())
		dai = new Sai(ownerDependencies, daiAddress)
		mkr = new Gov(ownerDependencies, await maker.gov_())
		weth = {
			owner: new Gem(ownerDependencies, wethAddress),
			user: new Gem(userDependencies, wethAddress),
			affiliate: new Gem(affiliateDependencies, wethAddress)
		}

		await liquidLong.owner.awaitReady
		await liquidLong.user.awaitReady
		await liquidLong.affiliate.awaitReady
	})

	after(async () => {
		await liquidLong.owner.shutdown()
		await liquidLong.user.shutdown()
		await liquidLong.affiliate.shutdown()
	})

	beforeEach(async () => {
		await sweep()
		await fundAccount('user', 1e9)
		await fundAccount('affiliate', 1e9)
		await liquidLong.owner.adminDepositEth(100)
		await mkr.mint(liquidLongAddress, QUINTILLION)
		await oasis.offer(QUINTILLION.mul(100), wethAddress, QUINTILLION.mul(600*100 * 1.02), daiAddress, bigNumberify(0))
		await oasis.offer(QUINTILLION.mul(600*100), daiAddress, QUINTILLION.mul(100 * 1.02), wethAddress, bigNumberify(0))
	})

	afterEach(async () => {
		await sweep()
	})

	describe('getEthPriceInUsd', async () => {
		it('should return baked in price of 600', async () => {
			const price = await liquidLong.owner.getEthPriceInUsd()

			expect(price).to.equal(600)
		})

		// TODO: build the infrastructure for having some integration tests run using a MockScheduler instead of TimerScheduler like unit tests do
		it.skip('should publish update to price feed when polled', async () => {
			const newPrice = Bytes32.fromHexString('0x' + ('0000000000000000000000000000000000000000000000000000000000000000' + bigNumberify(10).pow(18).mul(531).toHexString().substring(2)).slice(-64))
			medianizer.poke(newPrice)
			await delay(15000)

			const price = await liquidLong.owner.getEthPriceInUsd()

			expect(price).to.equal(531)
		})
	})

	describe('getMaxLeverageSizeInEth', async () => {
		it.skip('should return default price of 0', async () => {
			// FIXME: this is racey with the polling time being so fast, result will either be 0 or 50 depending on timing
			const maxLeverage = await liquidLong.owner.getMaxLeverageSizeInEth()

			expect(maxLeverage).to.equal(0)
		})
	})

	describe('openPosition', async () => {
		it('should be able to open an unleveraged position', async () => {
			const cupId = await liquidLong.user.openPosition(1, 1, 1, 1)

			expect(cupId).to.be.greaterThan(0)
		})

		// intentionally uses owner account since that is using the primary LL entrypoint (other accounts manually construct for inline signing) and we want to exercise that here
		it('should be able to open a leveraged position', async () => {
			// arrange
			const fee = await liquidLong.owner.getFeeInEth(2, 1)
			const cost = (await liquidLong.owner.getEstimatedCostsInEth(2, 1)).low

			// act
			const cupId = await liquidLong.owner.openPosition(2, 1, cost, fee)

			// assert
			expect(cupId).to.be.greaterThan(0)
		})

		it('should leave fee in the form of weth', async () => {
			// arrange
			const fee = await liquidLong.user.getFeeInEth(2, 1)
			const cost = (await liquidLong.user.getEstimatedCostsInEth(2, 1)).low
			const startingLiquidLongAttoweth = await weth.owner.balanceOf_(liquidLongAddress)

			// act
			await liquidLong.user.openPosition(2, 1, cost, fee)

			// assert
			const endingLiquidLongAttoweth = await weth.owner.balanceOf_(liquidLongAddress)
			const feeInAttoeth = bigNumberify(fee * 1e9).mul(1e9)
			const balanceChangeInAttoeth = endingLiquidLongAttoweth.sub(startingLiquidLongAttoweth)
			expect(balanceChangeInAttoeth.toString()).to.equal(feeInAttoeth.toString())
		})

		it('should split fee with affiliate', async () => {
			// arrange
			const fee = await liquidLong.user.getFeeInEth(2, 1)
			const cost = (await liquidLong.user.getEstimatedCostsInEth(2, 1)).low
			const startingLiquidLongAttoweth = await weth.owner.balanceOf_(liquidLongAddress)
			const startingAffiliateAttoeth = await weth.affiliate.balanceOf_(Address.fromHexString(wallets.affiliate.address))

			// act
			await liquidLong.user.openPosition(2, 1, cost, fee, Address.fromHexString(wallets.affiliate.address))

			// assert
			const endingLiquidLongAttoweth = await weth.owner.balanceOf_(liquidLongAddress)
			const endingAffiliateAttoweth = await weth.affiliate.balanceOf_(Address.fromHexString(wallets.affiliate.address))
			const feeInAttoeth = bigNumberify(fee * 1e9).mul(1e9)
			const liquidLongBalanceChangeInAttoweth = endingLiquidLongAttoweth.sub(startingLiquidLongAttoweth)
			const affiliateBalanceChangeInAttoweth = endingAffiliateAttoweth.sub(startingAffiliateAttoeth)
			expect(liquidLongBalanceChangeInAttoweth.toString()).to.equal(feeInAttoeth.div(2).toString())
			expect(affiliateBalanceChangeInAttoweth.toString()).to.equal(feeInAttoeth.div(2).toString())
		})
	})

	describe('closePosition', async () => {
		it('should be able to close a leveraged position', async () => {
			// arrange
			const fee = await liquidLong.user.getFeeInEth(2, 1)
			const cost = (await liquidLong.user.getEstimatedCostsInEth(2, 1)).low
			const cupId = await liquidLong.user.openPosition(2, 1, cost, fee)
			const encodedCupId = Bytes32.fromByteArray(maker.encodeParameters([{name: 'temp', type: 'uint256'}], [bigNumberify(cupId)]))
			const proxy = await maker.lad_(encodedCupId)
			// CDP fees change every second, so if the time between estimating this value and then actually closing the position ticks past a 1 second block boundary then the close will fail, so we fudge this by a tiny amount
			const expectedPayout = await liquidLong.user.tryGetEstimatedCloseYieldInEth(proxy, cupId) - 0.000001
			const startingEthBalance = Number.parseInt((await wallets.user.getBalance()).toString(), 10) / 1e18

			// act
			await liquidLong.user.closePosition(proxy, cupId, expectedPayout)

			// assert
			const endingEthBalance = Number.parseInt((await wallets.user.getBalance()).toString(), 10) / 1e18
			expect(endingEthBalance).to.be.approximately(startingEthBalance + expectedPayout, 0.000001)
			const lockedCollateral = (await maker.ink_(encodedCupId)).div(1e9).toNumber() / 1e9
			expect(lockedCollateral).to.equal(0)
		})

		it('should split fee with affiliate', async () => {
			// arrange
			const fee = await liquidLong.user.getFeeInEth(2, 1)
			const cost = (await liquidLong.user.getEstimatedCostsInEth(2, 1)).low
			const cupId = await liquidLong.user.openPosition(2, 1, cost, fee)
			const encodedCupId = Bytes32.fromByteArray(maker.encodeParameters([{name: 'temp', type: 'uint256'}], [bigNumberify(cupId)]))
			const proxy = await maker.lad_(encodedCupId)
			const affiliate = Address.fromHexString(wallets.affiliate.address)
			const startingLiquidLongAttoweth = await weth.owner.balanceOf_(liquidLongAddress)
			const startingAffiliateAttoeth = await weth.affiliate.balanceOf_(affiliate)

			// act
			await liquidLong.user.closePosition(proxy, cupId, 0, affiliate)

			// assert
			const endingLiquidLongAttoweth = await weth.owner.balanceOf_(liquidLongAddress)
			const endingAffiliateAttoweth = await weth.affiliate.balanceOf_(affiliate)
			const liquidLongBalanceChangeInAttoweth = endingLiquidLongAttoweth.sub(startingLiquidLongAttoweth).div(1e9).toNumber() / 1e9
			const affiliateBalanceChangeInAttoweth = endingAffiliateAttoweth.sub(startingAffiliateAttoeth).div(1e9).toNumber() / 1e9
			expect(affiliateBalanceChangeInAttoweth).to.be.greaterThan(0)
			expect(liquidLongBalanceChangeInAttoweth).to.equal(affiliateBalanceChangeInAttoweth)
		})
	})

	const fundAccount = async (account: 'user'|'affiliate', amount: number) => {
		const value = QUINTILLION.mul(amount)
		if (value.isZero()) return
		const transactionResponse = await wallets.funder.sendTransaction({ gasLimit: 21000, gasPrice: 0, to: wallets[account].address, value: value })
		await transactionResponse.wait()
	}

	const sweepAccountEth = async (account: 'user'|'affiliate') => {
		const balance = await wallets[account].getBalance()
		if (balance.isZero()) return
		const transactionResponse = await wallets[account].sendTransaction({ gasLimit: 21000, gasPrice: 0, to: wallets.funder.address, value: balance })
		await transactionResponse.wait()
	}

	const withdrawAccountWethToEth = async (account: 'owner'|'user'|'affiliate') => {
		const balance = await weth[account].balanceOf_(Address.fromHexString(wallets[account].address))
		if (balance.isZero()) return
		await weth[account].withdraw(balance)
	}

	const sweep = async () => {
		await clearOasisOrderbook()
		const wethBalance = await weth.owner.balanceOf_(liquidLongAddress)
		await liquidLong.owner.adminWithdrawWeth(wethBalance.div(1e9).toNumber() / 1e9)
		await liquidLong.owner.adminWithdrawMkr()
		await withdrawAccountWethToEth('affiliate')
		await sweepAccountEth('user')
		await sweepAccountEth('affiliate')
	}

	const clearOasisOrderbook = async () => {
		while (true) {
			const bestOfferId = await oasis.getBestOffer_(wethAddress, daiAddress)
			if (bestOfferId.isZero()) break
			await oasis.cancel(bestOfferId)
		}
		while (true) {
			const bestOfferId = await oasis.getBestOffer_(daiAddress, wethAddress)
			if (bestOfferId.isZero()) break
			await oasis.cancel(bestOfferId)
		}
	}
})

async function spinUntilNodeIsReady(ethereumJsonRpcUrl: string, liquidLongAddress: Address): Promise<void> {
	console.log('waiting for node to get into a reasonable state...')
	const provider = new JsonRpcProvider(ethereumJsonRpcUrl, 4173)
	// spin until the provider returns a reasonable value
	while (true) {
		try {
			// 0xfa72c53e: providerFeePerEth()
			if (await provider.call({ to: liquidLongAddress.to0xString(), data: '0xfa72c53e' }) !== '0x') break
		} catch (error) {
			await delay(100)
		}
	}
	console.log('node is in a reasonable state, tests starting')
}

async function delay(milliseconds: number): Promise<void> {
	return new Promise<void>(resolve => {
		setTimeout(resolve, milliseconds)
	})
}
