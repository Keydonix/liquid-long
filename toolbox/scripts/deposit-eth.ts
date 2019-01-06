import { getEnv } from '../libraries/Environment'
import { PrivateKey } from '../libraries/PrivateKey'
import { LiquidLong, Weth } from '../libraries/liquid-long'
import { LiquidLongDependenciesEthers } from '../libraries/liquid-long-ethers-impl'
import { JsonRpcProvider } from 'ethers/providers'
import { Wallet } from 'ethers/wallet'
import { bigNumberify } from 'ethers/utils';

async function doStuff() {
	// gather/validate inputs
	const jsonRpcAddress = getEnv('ETHEREUM_HTTP', 'http://localhost:1235')
	const gasPrice = parseInt(getEnv('ETHEREUM_GAS_PRICE_IN_NANOETH', '1'), 10)
	const liquidLongAddress = getEnv('ETHEREUM_LIQUID_LONG_ADDRESS', 'f3bcabd8fae29f75be271ebe2499edb4c7c139b7')
	const privateKey = PrivateKey.fromHexString(getEnv('ETHEREUM_PRIVATE_KEY', 'fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a'))

	const provider = new JsonRpcProvider(jsonRpcAddress, 4173)
	const wallet = new Wallet(privateKey.toHexStringWithPrefix(), provider)

	const dependencies = new LiquidLongDependenciesEthers(provider, wallet, gasPrice)
	const liquidLong = new LiquidLong(dependencies, liquidLongAddress)
	const weth = new Weth(dependencies, await liquidLong.weth_())
	console.log(`Depositing 100 ETH into Liquid Long.`)
	await liquidLong.wethDeposit({ attachedEth: bigNumberify(100).mul(1e18.toString()) })
	console.log(`Confirming new balance.`)
	const newBalance = await weth.balanceOf_(liquidLongAddress)
	console.log(`New weth balance: ${newBalance.div(1e9).toNumber() / 1e9}`)
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
