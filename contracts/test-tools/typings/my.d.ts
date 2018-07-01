declare module 'ethereum' {
	export type Primitive = 'uint8' | 'uint64' | 'uint256' | 'bool' | 'string' | 'address' | 'bytes20' | 'bytes32' | 'bytes' | 'int256' | 'address[]' | 'uint256[]' | 'bytes32[]';

	export interface AbiParameter {
		name: string,
		type: Primitive,
	}

	export interface AbiEventParameter extends AbiParameter {
		indexed: boolean,
	}

	export interface AbiFunction {
		name: string,
		type: 'function' | 'constructor' | 'fallback',
		stateMutability: 'pure' | 'view' | 'payable' | 'nonpayable',
		constant: boolean,
		payable: boolean,
		inputs: Array<AbiParameter>,
		outputs: Array<AbiParameter>,
	}

	export interface AbiEvent {
		name: string,
		type: 'event',
		inputs: Array<AbiEventParameter>,
		anonymous: boolean,
	}

	export type Abi = Array<AbiFunction | AbiEvent>;
}

declare module 'solc' {
	import { Abi, Primitive } from 'ethereum';

	interface CompilerInputSourceFile {
		keccak256?: string;
		urls: string[];
	}
	interface CompilerInputSourceCode {
		keccak256?: string;
		content: string;
	}
	interface CompilerInput {
		language: "Solidity" | "serpent" | "lll" | "assembly";
		settings?: any,
		sources: {
			[globalName: string]: CompilerInputSourceFile|CompilerInputSourceCode,
		};
	}
	interface CompilerOutputError {
		sourceLocation?: {
			file: string;
			start: number;
			end: number;
		};
		type: "TypeError" | "InternalCompilerError" | "Exception";
		component: "general" | "ewasm";
		severity: "error" | "warning";
		message: string;
		formattedMessage?: string;
	}
	interface CompilerOutputEvmBytecode {
		object: string;
		opcodes?: string;
		sourceMap?: string;
		linkReferences?: {} | {
			[globalName: string]: {
				[name: string]: {start: number, length: number}[];
			};
		};
	}
	interface CompilerOutputSources {
		[globalName: string]: {
			id: number;
			ast: any;
			legacyAST: any;
		},
	}
	interface CompilerOutputContracts {
		[globalName: string]: {
			[contractName: string]: {
				abi: Abi;
				metadata?: string;
				userdoc?: any;
				devdoc?: any;
				ir?: string;
				evm: {
					assembly?: string;
					legacyAssembly?: any;
					bytecode: CompilerOutputEvmBytecode;
					deployedBytecode?: CompilerOutputEvmBytecode;
					methodIdentifiers?: {
						[methodName: string]: string;
					};
					gasEstimates?: {
						creation: {
							codeDepositCost: string;
							executionCost: string;
							totalCost: string;
						};
						external: {
							[functionSignature: string]: string;
						};
						internal: {
							[functionSignature: string]: string;
						};
					};
				};
				ewasm?: {
					wast: string;
					wasm: string;
				}
			}
		};
	}
	interface CompilerOutput {
		errors?: CompilerOutputError[];
		sources?: CompilerOutputSources;
		contracts: CompilerOutputContracts;
	}
	type ReadCallback = (path: string) => { contents?: string, error?: string};
	function compileStandardWrapper(input: string, readCallback?: ReadCallback): string;
}

declare module 'recursive-readdir' {
	import * as fs from "fs";
	namespace RecursiveReaddir {
		type IgnoreFunction = (file: string, stats: fs.Stats) => boolean;
		type Callback = (error: Error, files: string[]) => void;
		interface readDir {
			(path: string, ignores?: (string|IgnoreFunction)[]): Promise<string[]>;
			(path: string, callback: Callback): void;
			(path: string, ignores: (string|IgnoreFunction)[], callback: Callback): void;
		}
	}

	var recursiveReadDir: RecursiveReaddir.readDir;
	export = recursiveReadDir;
}

declare module 'bn.js' {
  class BN {
    constructor(value: string | number, radix?: number);
    toString(radix: number): string;
    toNumber(): number;
    add(other: BN): BN;
    sub(other: BN): BN;
    mul(other: BN): BN;
    div(other: BN): BN;
    pow(other: BN): BN;

    static min(... args: Array<number|string|BN>): BN;
    static max(... args: Array<number|string|BN>): BN;
  }

  export = BN;
}
