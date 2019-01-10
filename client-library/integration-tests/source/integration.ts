require('source-map-support').install()

import 'mocha'
import { expect } from 'chai'
import { LiquidLong } from '@keydonix/liquid-long-client-library'
import { TimeoutScheduler } from '@keydonix/liquid-long-client-library/output/scheduler';
import { Oasis, Sai, Gem, Tub } from '@keydonix/maker-contract-interfaces'
import { ContractDependenciesEthers } from './maker-contract-dependencies'
import { getEnv } from './environment'
import { JsonRpcProvider } from 'ethers/providers'
import { Wallet } from 'ethers'
import { BigNumber, bigNumberify } from 'ethers/utils'

const QUINTILLION = bigNumberify(10).pow(18)

describe('liquid long tests', async () => {
	let ethereumAddress: string
	let privateKey: string
	let liquidLongAddress: string
	let oasisAddress: string
	let makerAddress: string
	let wethAddress: string
	let daiAddress: string

	let provider: JsonRpcProvider
	let wallets: { funder: Wallet, owner: Wallet, user: Wallet, affiliate: Wallet }
	let liquidLong: { owner: LiquidLong, user: LiquidLong, affiliate: LiquidLong }
	let oasis: Oasis<BigNumber>
	let maker: Tub<BigNumber>
	let dai: Sai<BigNumber>
	let weth: Gem<BigNumber>

	before(async () => {
		ethereumAddress = getEnv('ETHEREUM_HTTP', 'http://localhost:1235')
		privateKey = getEnv('ETHEREUM_PRIVATE_KEY', 'fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a')
		liquidLongAddress = getEnv('ETHEREUM_LIQUID_LONG_ADDRESS', '0xB03CF72BC5A9A344AAC43534D664917927367487')
		oasisAddress = getEnv('ETHEREUM_OASIS_ADDRESS', '0x3c6721551c2ba3973560aef3e11d34ce05db4047')
		wethAddress = getEnv('ETHEREUM_WETH_ADRESS', '0xfcaf25bf38e7c86612a25ff18cb8e09ab07c9885')
		makerAddress = getEnv('ETHEREUM_TUB_ADRESS', '0x93943fb2d02ce1101dadc3ab1bc3cab723fd19d6')
		daiAddress = getEnv('ETHEREUM_DAI_ADDRESS', '0x8c915bd2c0df8ba79a7d28538500a97bd15ea985')
		wethAddress = getEnv('ETHEREUM_WETH_ADDRESS', '0xfcaf25bf38e7c86612a25ff18cb8e09ab07c9885')

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
			owner: LiquidLong.createJsonRpc(ethereumAddress, liquidLongAddress, 0, 0.01, 0, 10),
			user: new LiquidLong(new TimeoutScheduler(), provider, wallets.user, liquidLongAddress, 0, 0.01, 0),
			affiliate: new LiquidLong(new TimeoutScheduler(), provider, wallets.affiliate, liquidLongAddress, 0, 0.01, 0),
		}
		const dependencies = new ContractDependenciesEthers(provider, provider.getSigner(0))
		oasis = new Oasis(dependencies, oasisAddress)
		maker = new Tub(dependencies, makerAddress)
		dai = new Sai(dependencies, daiAddress)
		weth = new Gem(dependencies, wethAddress)

		await liquidLong.owner.awaitReady
		await liquidLong.user.awaitReady
		await liquidLong.affiliate.awaitReady

		// this stuff really should be in `beforeEach`, but Geth is super slow so...
		await sweep()
		await fundAccount('user', 1e9)
		await fundAccount('affiliate', 1e9)
		await liquidLong.owner.adminDepositEth(100)
		await oasis.offer(QUINTILLION.mul(100), wethAddress, QUINTILLION.mul(600*100 * 1.02), daiAddress, bigNumberify(0))
		await oasis.offer(QUINTILLION.mul(600*100), daiAddress, QUINTILLION.mul(100 * 1.02), wethAddress, bigNumberify(0))
	})

	after(async () => {
		// this stuff should really be in `afterEach`, but Geth is super slow so...
		await sweep()

		await liquidLong.owner.shutdown()
		await liquidLong.user.shutdown()
		await liquidLong.affiliate.shutdown()
	})

	describe('getEthPriceInUsd', async () => {
		it('should return baked in price of 600', async () => {
			const price = await liquidLong.owner.getEthPriceInUsd()

			expect(price).to.equal(600)
		})
	})

	describe('openPosition', async () => {
		// FIXME: Attempting to open a position with 1x leverage will fail, we should either fail faster (in JS land), or fix the contract to let you open a 1x leverage position
		// it('should be able to open an unleveraged position', async () => {
		// 	await liquidLong.openPosition(1, 1, 1, 1)
		// 	await liquidLong.adminWithdrawEth(100)
		// })

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

		it('should send fee to owner', async () => {
			// arrange
			const fee = await liquidLong.user.getFeeInEth(2, 1)
			const cost = (await liquidLong.user.getEstimatedCostsInEth(2, 1)).low
			await liquidLong.owner.adminWithdrawFees()
			const startingOwnerAttoeth = await wallets.owner.getBalance()

			// act
			await liquidLong.user.openPosition(2, 1, cost, fee)
			await liquidLong.owner.adminWithdrawFees()

			// assert
			const endingOwnerAttoeth = await wallets.owner.getBalance()
			const feeInAttoeth = bigNumberify(fee * 1e9).mul(1e9)
			const balanceChangeInAttoeth = endingOwnerAttoeth.sub(startingOwnerAttoeth)
			expect(balanceChangeInAttoeth.toString()).to.equal(feeInAttoeth.toString())
		})

		it('should split fee with affiliate', async () => {
			// arrange
			const fee = await liquidLong.user.getFeeInEth(2, 1)
			const cost = (await liquidLong.user.getEstimatedCostsInEth(2, 1)).low
			const startingOwnerAttoeth = await wallets.owner.getBalance()
			const startingAffiliateAttoeth = await wallets.affiliate.getBalance()

			// act
			await liquidLong.user.openPosition(2, 1, cost, fee, wallets.affiliate.address)
			await Promise.all([
				liquidLong.owner.adminWithdrawFees(),
				liquidLong.affiliate.adminWithdrawFees(),
			])

			// assert
			const endingOwnerAttoeth = await wallets.owner.getBalance()
			const endingAffiliateAttoeth = await wallets.affiliate.getBalance()
			const feeInAttoeth = bigNumberify(fee * 1e9).mul(1e9)
			const ownerBalanceChangeInAttoeth = endingOwnerAttoeth.sub(startingOwnerAttoeth)
			const affiliateBalanceChangeInAttoeth = endingAffiliateAttoeth.sub(startingAffiliateAttoeth)
			expect(ownerBalanceChangeInAttoeth.toString()).to.equal(feeInAttoeth.div(2).toString())
			expect(affiliateBalanceChangeInAttoeth.toString()).to.equal(feeInAttoeth.div(2).toString())
		})
	})

	const fundAccount = async (account: 'user'|'affiliate', amount: number) => {
		await (await wallets.funder.sendTransaction({ gasLimit: 21000, gasPrice: 0, to: wallets[account].address, value: QUINTILLION.mul(amount) })).wait()
	}

	const sweep = async () => {
		await clearOasisOrderbook()
		const wethBalance = await weth.balanceOf_(liquidLongAddress)
		await liquidLong.owner.adminWithdrawWeth(wethBalance.div(1e9).toNumber() / 1e9)
		await Promise.all([
			liquidLong.owner.adminWithdrawFees(),
			liquidLong.affiliate.adminWithdrawFees(),
		])
		await (await wallets.owner.sendTransaction({ gasLimit: 21000, gasPrice: 0, to: wallets.funder.address, value: await wallets.owner.getBalance() })).wait()
		await (await wallets.user.sendTransaction({ gasLimit: 21000, gasPrice: 0, to: wallets.funder.address, value: await wallets.user.getBalance() })).wait()
		await (await wallets.affiliate.sendTransaction({ gasLimit: 21000, gasPrice: 0, to: wallets.funder.address, value: await wallets.affiliate.getBalance() })).wait()
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

async function spinUntilNodeIsReady(ethereumAddress: string, liquidLongAddress: string): Promise<void> {
	console.log('waiting for node to get into a reasonable state...')
	const provider = new JsonRpcProvider(ethereumAddress, 4173)
	// spin until the provider returns a reasonable value
	while (true) {
		try {
			// 0xfa72c53e: providerFeePerEth()
			if (await provider.call({ to: liquidLongAddress, data: '0xfa72c53e' }) !== '0x') break
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
