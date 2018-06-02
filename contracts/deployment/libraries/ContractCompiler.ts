import { Abi } from 'ethereum'
import fs = require('fs')
import readFile = require('fs-readfile-promise');
import path = require('path')
import * as recursiveReadDir from 'recursive-readdir'
import { CompilerOutput, compileStandardWrapper, CompilerInput } from 'solc';

export class ContractCompiler {
	public async compileContracts(): Promise<CompilerOutput> {
		const compilerInputJson = await this.generateCompilerInput()
		const compilerOutputJson = compileStandardWrapper(JSON.stringify(compilerInputJson))
		const compilerOutput: CompilerOutput = JSON.parse(compilerOutputJson);
		const errors = (compilerOutput.errors || []).filter(error => !/Experimental features are turned on\. Do not use experimental features on live deployments\./.test(error.message))
		if (errors) {
			let concatenatedErrors = "";

			for (let error of errors) {
				concatenatedErrors += error.formattedMessage + "\n";
			}

			if (concatenatedErrors.length > 0) {
				throw new Error("The following errors/warnings were returned by solc:\n\n" + concatenatedErrors);
			}
		}

		return compilerOutput
	}

	public async generateCompilerInput(): Promise<CompilerInput> {
		const sourceRoot = path.join(__dirname, '../../source/')
		const filePaths = await recursiveReadDir(sourceRoot)
		const filesPromises = filePaths.map(async filePath => (await readFile(filePath)).toString('utf8'))
		const files = await Promise.all(filesPromises)

		const inputJson: CompilerInput = {
			language: "Solidity",
			settings: {
				optimizer: {
					enabled: true,
					runs: 500
				},
				outputSelection: {
					"*": {
						"*": [ "abi", "evm.bytecode.object" ]
					}
				}
			},
			sources: {}
		}
		for (var file in files) {
			const filePath = filePaths[file].replace(sourceRoot, "").replace(/\\/g, "/")
			inputJson.sources[filePath] = { content : files[file] }
		}

		return inputJson
	}
}
