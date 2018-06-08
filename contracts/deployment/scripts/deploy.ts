import { Address } from '../libraries/Address'
import { ByteArray } from '../libraries/ByteArray';
import { PrivateKey } from '../libraries/PrivateKey'
import { ContractCompiler } from '../libraries/ContractCompiler'
import { ContractDeployer } from '../libraries/ContractDeployer'
import { sleep } from '../libraries/Utils';
import { utils, providers } from 'ethers'

async function spinUntilConnected(jsonRpcAddress: string) {
	const provider = new providers.JsonRpcProvider(jsonRpcAddress, { chainId: 4173, ensAddress: '', name: 'dev' })
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

function getEnv(name: string): string {
	const value = process.env[name]
	if (value === undefined) throw new Error(`${name} environment variable required`)
	return value
}

async function doStuff() {
	// gather/validate inputs
	const jsonRpcAddress = getEnv('ETHEREUM_HTTP')
	const gasPriceInNanoeth = parseInt(getEnv('ETHEREUM_GAS_PRICE_IN_NANOETH'), 10)
	const privateKey = PrivateKey.fromHexString(getEnv('ETHEREUM_PRIVATE_KEY'))
	const oasisAddress = Address.fromHexString(getEnv('ETHEREUM_OASIS_ADDRESS'))
	const makerAddress = Address.fromHexString(getEnv('ETHEREUM_MAKER_ADRESS'))

	console.log('compiling contracts...')
	const contractCompiler = new ContractCompiler()
	const result = await contractCompiler.compileContracts()
	const abi = result.contracts['liquid-long.sol']['LiquidLong'].abi
	const bytecode = ByteArray.fromHexString(result.contracts['liquid-long.sol']['LiquidLong'].evm.bytecode.object)

	await spinUntilConnected(jsonRpcAddress)

	console.log('deploying contracts...')
	const contractDeployer = new ContractDeployer(jsonRpcAddress, gasPriceInNanoeth, privateKey, abi, bytecode)
	const liquidLongContractAddress = await contractDeployer.deploy(oasisAddress, makerAddress)
	console.log(`LiquidLong deployed to ${liquidLongContractAddress.toHexString()}`)
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
