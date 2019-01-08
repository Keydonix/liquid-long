require('source-map-support').install()

import 'mocha'
import { expect } from 'chai'
import { LiquidLong } from '@keydonix/liquid-long-client-library'
import { Oasis, Sai, Gem, Tub } from '@keydonix/maker-contract-interfaces'
import { ContractDependenciesEthers } from './maker-contract-dependencies'
import { getEnv } from './environment'
import { JsonRpcProvider } from 'ethers/providers'
import { BigNumber, bigNumberify } from 'ethers/utils'

describe('liquid long tests', async () => {
	let ethereumAddress: string
	let liquidLongAddress: string
	let oasisAddress: string
	let makerAddress: string
	let wethAddress: string
	let daiAddress: string
	before(async () => {
		ethereumAddress = getEnv('ETHEREUM_HTTP', 'http://localhost:1235')
		liquidLongAddress = getEnv('ETHEREUM_LIQUID_LONG_ADDRESS', '0x80F8DAa435a9AB4B1802Ba56FE7e0abd0f8aB3D3')
		oasisAddress = getEnv('ETHEREUM_OASIS_ADDRESS', '0x3c6721551c2ba3973560aef3e11d34ce05db4047')
		wethAddress = getEnv('ETHEREUM_WETH_ADRESS', '0xfcaf25bf38e7c86612a25ff18cb8e09ab07c9885')
		makerAddress = getEnv('ETHEREUM_TUB_ADRESS', '0x93943fb2d02ce1101dadc3ab1bc3cab723fd19d6')
		daiAddress = getEnv('ETHEREUM_DAI_ADDRESS', '0x8c915bd2c0df8ba79a7d28538500a97bd15ea985')
		wethAddress = getEnv('ETHEREUM_WETH_ADDRESS', '0xfcaf25bf38e7c86612a25ff18cb8e09ab07c9885')

		await spinUntilNodeIsReady(ethereumAddress, liquidLongAddress)
	})

	let liquidLong: LiquidLong
	let oasis: Oasis<BigNumber>
	let maker: Tub<BigNumber>
	let dai: Sai<BigNumber>
	let weth: Gem<BigNumber>
	beforeEach(async () => {
		const provider = new JsonRpcProvider(ethereumAddress)
		const signer = provider.getSigner(0)
		provider.pollingInterval = 10
		liquidLong = LiquidLong.createJsonRpc(ethereumAddress, liquidLongAddress, 0, 0.01, 10)
		oasis = new Oasis(new ContractDependenciesEthers(provider, signer), oasisAddress)
		maker = new Tub(new ContractDependenciesEthers(provider, signer), makerAddress)
		dai = new Sai(new ContractDependenciesEthers(provider, signer), daiAddress)
		weth = new Gem(new ContractDependenciesEthers(provider, signer), wethAddress)
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
			await oasis.offer(bigNumberify(100).mul(1e18.toString()), wethAddress, bigNumberify(600*100 * 1.02).mul(1e18.toString()), daiAddress, bigNumberify(0))
			await oasis.offer(bigNumberify(600*100).mul(1e18.toString()), daiAddress, bigNumberify(100 * 0.98).mul(1e18.toString()), wethAddress, bigNumberify(0))
		})
		afterEach(async () => {
		})
		// FIXME: Attempting to open a position with 1x leverage will fail, we should either fail faster (in JS land), or fix the contract to let you open a 1x leverage position
		// it('should be able to open an unleveraged position', async () => {
		// 	await liquidLong.openPosition(1, 1, 1, 1)
		// 	await liquidLong.adminWithdrawEth(100)
		// })
		it('should be able to open a leveraged position', async () => {
			// arrange
			const fee = await liquidLong.getFeeInEth(2, 1)
			const cost = (await liquidLong.getEstimatedCostsInEth(2, 1)).low

			// act
			const cupId = await liquidLong.openPosition(2, 1, cost, fee)

			// cleanup
			await liquidLong.adminWithdrawEth(100 - fee - cost - 1)
		})
	})
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
