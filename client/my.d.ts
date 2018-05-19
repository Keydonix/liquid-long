interface Transaction {
	to: string
	from?: string
	gas?: string
	gasPrice?: string
	value?: string
	data: string
}

interface JsonRpcRequest {
	jsonrpc: '2.0'
	id: number
	method: 'eth_call'
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
	mode?: 'opening'|'closing'
	updatesPending?: boolean
	priceOfEthInUsd?: number
	estimatedPriceOfEthInDai?: number
	limitPriceOfEthInDai?: number
	leverageMultiplier?: number
	leverageSizeInEth?: number
}
