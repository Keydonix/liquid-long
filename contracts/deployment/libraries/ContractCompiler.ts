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
		if (compilerOutput.errors) {
			let errors = "";

			for (let error of compilerOutput.errors) {
				errors += error.formattedMessage + "\n";
			}

			if (errors.length > 0) {
				throw new Error("The following errors/warnings were returned by solc:\n\n" + errors);
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
