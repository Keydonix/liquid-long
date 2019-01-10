import { Wallet } from 'ethers/wallet'
import { JsonRpcProvider } from 'ethers/providers'
import { LiquidLong } from '../libraries/liquid-long'
import { LiquidLongDependenciesEthers } from '../libraries/liquid-long-ethers-impl'
import { Tub, Oasis, ProxyRegistry, DSProxy } from '@keydonix/maker-contract-interfaces'

async function doStuff() {
	const provider = new JsonRpcProvider('http://localhost:1235', 4173)
	const wallet = new Wallet('0xfae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a', provider)
	const dependencies = new LiquidLongDependenciesEthers(provider, wallet, 1)
	const liquidLong = new LiquidLong(dependencies, 'B03CF72BC5A9A344AAC43534D664917927367487')
	const maker = new Tub(dependencies, await liquidLong.maker_())
	const oasis = new Oasis(dependencies, await liquidLong.oasis_())
	const proxyRegistry = new ProxyRegistry(dependencies, await liquidLong.proxyRegistry_())

	const result = await proxyRegistry.proxies_(wallet.address)
	const proxy = new DSProxy(dependencies, result)
	await proxy.setOwner('0000000000000000000000000000000000000000')
	const logs = await proxyRegistry.build(await wallet.address)
	console.log(logs)
	// const ethPrice = await liquidLong.ethPriceInUsd_()
	// console.log(ethPrice.toString())
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
