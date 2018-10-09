import { ContractCompiler } from '../libraries/ContractCompiler'
import { ContractInterfaceGenerator } from '../libraries/ContractInterfacesGenerator'
import { AbiFunction, AbiEvent } from 'ethereum';
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { CompilerOutput } from 'solc';
const fsWriteFile = promisify(fs.writeFile)
const fsCopyFile = promisify(fs.copyFile)

async function doStuff() {
	const contractCompiler = new ContractCompiler()
	const compilerOutput = await contractCompiler.compileContracts()
	const abi = compilerOutput.contracts['liquid-long.sol']['LiquidLong'].abi
	const bytecode = compilerOutput.contracts['liquid-long.sol']['LiquidLong'].evm.bytecode.object
	await writeJson(abi)
	await writeTs(compilerOutput)
	console.log(JSON.stringify(abi))
	console.log(bytecode)
}

async function writeJson(abi: (AbiFunction | AbiEvent)[]) {
	const filePath = path.join(__dirname, '../../output/liquid-long-abi.json')
	const fileContents = JSON.stringify(abi, undefined, '\t')
	return await fsWriteFile(filePath, fileContents, { encoding: 'utf8', flag: 'w' })
}

async function writeTs(compilerOutput: CompilerOutput) {
	const filePath = path.join(__dirname, '../../output/liquid-long.ts')
	const fileContents = await new ContractInterfaceGenerator().generateContractInterfaces(compilerOutput)
	await fsWriteFile(filePath, fileContents, { encoding: 'utf8', flag: 'w' })
	await fsWriteFile(path.join(__dirname, '../../../client-library/library/source/generated/liquid-long.ts'), fileContents, { encoding: 'utf8', flag: 'w' })
	await fsWriteFile(path.join(__dirname, '../../../toolbox/libraries/liquid-long.ts'), fileContents, { encoding: 'utf8', flag: 'w' })
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
