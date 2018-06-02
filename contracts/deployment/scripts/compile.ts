import { ContractCompiler } from '../libraries/ContractCompiler'

async function doStuff() {
	const contractCompiler = new ContractCompiler()
	const result = await contractCompiler.compileContracts()
	const abi = result.contracts['liquid-long.sol']['LiquidLong'].abi
	const bytecode = result.contracts['liquid-long.sol']['LiquidLong'].evm.bytecode.object
	console.log(JSON.stringify(abi))
	console.log(bytecode)
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
