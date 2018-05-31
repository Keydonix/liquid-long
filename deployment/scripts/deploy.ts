import { Address } from '../libraries/Address'
import { ByteArray } from '../libraries/ByteArray';
import { PrivateKey } from '../libraries/PrivateKey'
import { ContractCompiler } from '../libraries/ContractCompiler'
import { ContractDeployer } from '../libraries/ContractDeployer'
import { sleep } from '../libraries/Utils';
import { utils, providers } from 'ethers'

async function spinUntilConnected(jsonRpcAddress: string) {
	const provider = new providers.JsonRpcProvider(jsonRpcAddress, { chainId: 17, ensAddress: '', name: 'instant' })
	while (true) {
		try {
			console.log(`attempting to connect to Ethereum node at ${jsonRpcAddress}...`)
			await provider.getBlockNumber()
			break
		} catch (error) {
			await sleep(1000)
			continue
		}
	}
}

async function doStuff() {
	const jsonRpcAddress = process.env.ETHEREUM_HTTP
	if (jsonRpcAddress === undefined) throw new Error('ETHEREUM_HTTP environment variable required')
	const gasPriceInNanoethString = process.env.ETHEREUM_GAS_PRICE_IN_NANOETH
	if (gasPriceInNanoethString === undefined) throw new Error('ETHEREUM_GAS_PRICE_IN_NANOETH environment variable required')
	const gasPriceInNanoeth = parseInt(gasPriceInNanoethString, 10)
	const privateKeyString = process.env.ETHEREUM_PRIVATE_KEY
	if (privateKeyString === undefined) throw new Error('ETHEREUM_PRIVATE_KEY environment variable required')
	const privateKey = PrivateKey.fromHexString(privateKeyString)
	const oasisAddress = Address.fromHexString('0000000000000000000000000000000000000000')
	const makerAddress = Address.fromHexString('0000000000000000000000000000000000000000')

	console.log('compiling contracts...')
	const contractCompiler = new ContractCompiler()
	const result = await contractCompiler.compileContracts()
	const abi = result.contracts['liquid-long.sol']['LiquidLong'].abi
	const bytecode = ByteArray.fromHexString(result.contracts['liquid-long.sol']['LiquidLong'].evm.bytecode.object)

	await spinUntilConnected(jsonRpcAddress)

	console.log('deploying contracts...')
	const contractDeployer = new ContractDeployer(jsonRpcAddress, gasPriceInNanoeth, privateKey, abi, bytecode)
	await contractDeployer.deploy(oasisAddress, makerAddress)
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
