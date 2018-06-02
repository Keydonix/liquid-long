interface Transaction {
	to: string
	from?: string
	gas?: string
	gasPrice?: string
	value?: string
	data: string
}

type JsonRpcMethods = 'eth_call' | 'net_version' | 'eth_coinbase'

interface JsonRpcRequest {
	jsonrpc: '2.0'
	id: number
	method: JsonRpcMethods
	from?: string
	params: (Transaction|'latest')[]
}

interface JsonRpcResponse {
	jsonrpc: '2.0'
	id: number
	result?: any
	error?: {
		code: number
		message: string
		data?: any
	},
}

interface Web3Provider {
	sendAsync: (jsonRpc: JsonRpcRequest, callback: (error: Error, response: JsonRpcResponse) => void) => void
}

interface Web3 {
	currentProvider: Web3Provider
}

interface Window {
	web3: Web3
}

type Networks = '1'|'3'|'4'|'42'|'17'
type Modes = 'opening'|'closing'
type InsufficientDepth = 'insufficient depth'

interface CDP {
	id: number
	debtInDai: number
	lockedEth: number
	ourFee: number
	exchangeFee: number
	state: 'user-controlled'|'contract-controlled'
}

// null is used to reset a value to its default
interface StateUpdate {
	networkId?: Networks | null
	account?: string | null
	mode?: Modes | null

	priceOfEthInUsd?: number | null
	estimatedPriceOfEthInDai?: number | InsufficientDepth | null
	limitPriceOfEthInDai?: number | null
	leverageMultiplier?: number | null
	leverageSizeInEth?: number | null

	cdps?: CDP[] | null
}

// The following is necessary due to a bug in the TypeScript definition file, can be removed when https://github.com/Keydonix/liquid-long/pull/22 is merged
interface NumberConstructor {
	/**
	 * Returns true if passed value is finite.
	 * Unlike the global isFinite, Number.isFinite doesn't forcibly convert the parameter to a
	 * number. Only finite values of the type number, result in true.
	 * @param value A numeric value.
	 */
	isFinite(value: any): value is number;

	/**
	 * Returns true if the value passed is an integer, false otherwise.
	 * @param value A numeric value.
	 */
	isInteger(value: any): value is number;

	/**
	 * Returns a Boolean value that indicates whether a value is the reserved value NaN (not a
	 * number). Unlike the global isNaN(), Number.isNaN() doesn't forcefully convert the parameter
	 * to a number. Only values of the type number, that are also NaN, result in true.
	 * @param value A numeric value.
	 */
	isNaN(value: any): value is number;

	/**
	 * Returns true if the value passed is a safe integer.
	 * @param value A numeric value.
	 */
	isSafeInteger(value: any): value is number;
}

interface NodeListOf<TNode extends Node> extends NodeList {
	forEach(callback: (currentValue: TNode, currentIndex: number, listObj: NodeListOf<TNode>) => void, thisArg: any): void
}
