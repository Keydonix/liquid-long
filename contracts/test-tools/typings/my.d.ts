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

// Can be deleted when https://github.com/ethers-io/ethers.js/pull/99 is deployed
declare module 'ethers' {
	class Wallet {
		public constructor(privateKey: SigningKey | string, provider?: providers.Provider)

		static createRandom(options?: any): Wallet
		static verifyMessage(message: string, signature: string): string
		static parseTransaction(rawTransaction: any): Transaction
		static isEncryptedWallet(json: JSON): boolean
		static fromEncryptedWallet(json: JSON, password: string, progressCallback?: Function): Promise<Wallet>
		static fromMnemonic(mnemonic: string, path: string): Wallet
		static fromBrainWallet(username: string, password: string, progressCallback?: Function): Promise<Wallet>

		readonly privateKey: string
		readonly address: string

		provider?: providers.Provider
		defaultGasLimit: number

		sign(transaction: Transaction): utils.RLP
		signMessage(message: string): string
		encrypt(password: string, options: any, progressCallback?: Function): Promise<any>

		getAddress(): string
		getBalance(blockTag: string): Promise<number>
		getTransactionCount(blockTag: string): Promise<number>
		estimateGas(transaction: Transaction): Promise<number>
		sendTransaction(transaction: Transaction): Promise<Transaction>
		send(addressOrENSName: string, amountWei: utils.BigNumber, options?: any): Promise<Transaction>
	}

	class SigningKey {
		public constructor(privateKey: any)
		static recover(digest: any, r: string, s: string, recoveryParam: any): SigningKey
		static getPublicKey(value: any, compressed?: boolean): string
		static publicKeyToAddress(publicKey: any): string

		readonly privateKey: string
		readonly publicKey: string
		readonly address: string

		signDigest(digest: any): any
	}

	class Contract {
		public constructor(addressOrENSName: string, contractInterface: string | object | Interface, signerOrProvider: Wallet | providers.Provider)

		readonly address: string
		readonly contractInterface: Interface
		readonly signer: any
		readonly provider: providers.JsonRpcProvider
		readonly estimate: any
		readonly functions: any
		readonly events: any

		connect(signerOrProvider: any): Contract
		static getDeployTransaction(bytecode: string, contractInterface: string, ...constructorArguments: Array<any>): Transaction

		[key: string]: any
	}

	class Interface {
		public constructor(abi: any)

		static encodeParams(names: any[], types: any[], values: any[]): string
		static decodeParams(names: any[], types: any[], values: any[]): any

		readonly abi: any
		readonly functions: any
		readonly events: any
		readonly deployFunction: Function
	}

	namespace providers {

		export type Network = {
			chainId: number
			ensAddress: string
			name: string
		}

		export type Networks = {[index: string]: Network}

		export type Web3CurrentProvider = {
			sendAsync(request: any, callback: (err: Error, result: any) => void): Promise<any>
		}

		const networks: Networks

		function getDefaultProvider(network?: Network): JsonRpcProvider

		class Provider {
			public constructor(network: Network | string)

			static fetchJSON(url: string, json: JSON, processFunc?: Function): Promise<any>
			static networks: Networks

			chainId: number
			ensAddress: string
			name: string

			waitForTransaction(transactionHash: string, timeout: number): Promise<Transaction>
			getBlockNumber(): Promise<number>
			getGasPrice(): Promise<utils.BigNumber>
			getBalance(addressOrENSName: string, blockTag: string): Promise<utils.BigNumber>
			getTransactionCount(addressOrENSName: string, blockTag: string): Promise<number>
			getCode(addressOrENSName: string, blockTag: string): Promise<string>
			getStorageAt(addressOrENSName: string, position: string, blockTag: string): Promise<string>
			sendTransaction(signedTransaction: string): Promise<string>
			call(transaction: Transaction): Promise<string>
			estimateGas(transaction: Transaction): Promise<utils.BigNumber>
			getBlock(blockHashOrBlockTag: string): Promise<any>
			getTransaction(transactionHash: string): Promise<Transaction>
			getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>
			getLogs(filter: any): Promise<string[]>
			getEtherPrice(): Promise<number>
			resolveName(name: string): Promise<string>
			lookupAddress(address: string): Promise<string>
			resetEventsBlock(blockNumber: number): void
			polling(value?: number): void
		}

		class EtherscanProvider extends Provider {
			public constructor(network: Network, apiKey: string)
			perform(method: string, params: string[]): Promise<string>
			getHistory(addressOrENSName: string, startBlock: number, endBlock: number): Promise<any[]>
		}

		class FallbackProvider extends Provider {
			public constructor(providers: Provider[])
			perform(method: string, params: string[]): Promise<string>
		}

		class JsonRpcProvider extends Provider {
			public constructor(url: string, network?: Network | string)
			send(method: string, params: string[]): Promise<string>
			perform(method: string, params: string[]): Promise<string>
		}

		class InfuraProvider extends JsonRpcProvider {
			public constructor(network: Network, apiAccessToken: string)
		}

		class Web3Provider extends JsonRpcProvider {
			public constructor(web3provider: Web3CurrentProvider, network?: Network | string)
			getSigner(address?: string): Web3Signer
			listAccounts(): Promise<string[]>
		}

		class Web3Signer {
			private constructor(provider: Web3Provider, address?: string)

			getAddress(): Promise<string>
			getBalance(blockTag: string): Promise<utils.BigNumber>
			getTransactionCount(blockTag: string): Promise<number>
			sendTransaction(transaction: Transaction): Promise<Transaction>
			signMessage(message: string): Promise<string>
			unlock(password: string): Promise<string>
		}

	}

	export type Transaction = {
		chainId: number
		hash?: string
		from: string
		to: string
		data: any
		nonce: utils.BigNumber
		gasPrice: utils.BigNumber
		gasLimit: utils.BigNumber
		value: utils.BigNumber
	}

	export type TransactionReceipt = {
		contractAddress: string | null
		transactionIndex: number
		gasUsed: utils.BigNumber
		logsBloom: string
		blockHash: string
		transactionHash: string
		logs: Array<any>
		blockNumber: number
		cumulativeGasUsed: utils.BigNumber
		status: number
		byzantium: boolean
	}

	namespace utils {
		type RLP = string

		const etherSymbol: string

		function arrayify(hex: string, name?: string): Uint8Array

		function concat(objects: any[]): Uint8Array
		function padZeros(value: any, length: number): Uint8Array
		function stripZeros(value: any): Uint8Array

		function bigNumberify(value: any): BigNumber

		function hexlify(value: any): string

		function toUtf8Bytes(text: string): Uint8Array
		function toUtf8String(bytes: Uint8Array): string

		function namehash(name: string, depth: number): string
		function id(text: string): string

		function getAddress(address: string, generateIcap?: boolean): string
		function getContractAddress(transaction: any): string

		function formatEther(wei: BigNumber, options: any): string
		function parseEther(ether: string): BigNumber

		function keccak256(value: any): string
		function sha256(value: any): string

		function randomBytes(length: number): Uint8Array

		function solidityPack(types: string[], values: any[]): string
		function solidityKeccak256(types: string[], values: any[]): string
		function soliditySha256(types: string[], values: any[]): string

		class BigNumber {
			public constructor(value: any)

			static constantNegativeOne: BigNumber
			static constantZero: BigNumber
			static constantOne: BigNumber
			static constantTwo: BigNumber
			static constantWeiPerEther: BigNumber

			fromTwos(value: any): BigNumber
			toTwos(value: any): BigNumber
			add(other: any): BigNumber
			sub(other: any): BigNumber
			div(other: any): BigNumber
			mul(other: any): BigNumber
			mod(other: any): BigNumber
			pow(other: any): BigNumber
			maskn(value: any): BigNumber
			eq(other: any): boolean
			lt(other: any): boolean
			lte(other: any): boolean
			gt(other: any): boolean
			gte(other: any): boolean
			isZero(): boolean
			toNumber(base?: number): number
			toString(): string
			toHexString(): string
		}

		namespace RLP {
			function encode(object: any): string
			function decode(data: any): any
		}
	}
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
