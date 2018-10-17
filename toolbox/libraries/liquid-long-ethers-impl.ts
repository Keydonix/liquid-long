import { Dependencies, AbiFunction, AbiParameter, Transaction } from './liquid-long'
import { keccak256, toUtf8Bytes, BigNumber, AbiCoder, bigNumberify } from 'ethers/utils'
import { TransactionResponse, TransactionRequest, TransactionReceipt } from 'ethers/providers';
import { Wallet } from 'ethers/wallet';

export interface Provider {
	listAccounts(): Promise<Array<string>>
	send(method: string, params: any): Promise<any>
	sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse>
	call(transaction: TransactionRequest): Promise<string>
	estimateGas(transaction: TransactionRequest): Promise<BigNumber>
	getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>
	getTransactionCount(address: string): Promise<number>
}

export class LiquidLongDependenciesEthers implements Dependencies<BigNumber> {
	private readonly provider: Provider
	private readonly wallet: Wallet
	private readonly gasPriceInNeth: number
	public constructor(provider: Provider, wallet: Wallet, gasPriceInNeth: number) {
		this.provider = provider
		this.wallet = wallet
		this.gasPriceInNeth = gasPriceInNeth
	}

	keccak256 = (utf8String: string) => keccak256(toUtf8Bytes(utf8String))
	encodeParams = (abiFunction: AbiFunction, parameters: Array<any>) => new AbiCoder().encode(abiFunction.inputs, parameters).substr(2)
	decodeParams = (abiParameters: Array<AbiParameter>, encoded: string) => new AbiCoder().decode(abiParameters, encoded)
	getDefaultAddress = async () => (await this.provider.listAccounts())[0]
	call = async (transaction: Transaction<BigNumber>) => await this.provider.call(transaction)
	submitTransaction = async (transaction: Transaction<BigNumber>) => {
		const gasEstimate = await this.provider.estimateGas(transaction)
		Object.assign({}, transaction, { gasLimit: gasEstimate, gasPrice: bigNumberify(this.gasPriceInNeth).mul(1e9) })
		const receipt = await (await this.wallet.sendTransaction(transaction)).wait()
		if (receipt.status === undefined) throw new Error(`Receipt status was undefined, expected a number.\n${receipt}`)
		return { status: receipt.status! }
	}
}
