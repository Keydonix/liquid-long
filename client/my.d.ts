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

interface StateUpdate {
	networkId?: '1'|'3'|'4'|'42'
	account?: string
	mode?: 'opening'|'closing'
	priceOfEthInUsd?: number
	estimatedPriceOfEthInDai?: number
	limitPriceOfEthInDai?: number
	leverageMultiplier?: number
	leverageSizeInEth?: number
}
