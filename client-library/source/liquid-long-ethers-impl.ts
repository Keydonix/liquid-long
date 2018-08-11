import { Dependencies, AbiFunction, AbiParameter, Transaction } from './generated/liquid-long'
import { BigNumber, keccak256, toUtf8Bytes, AbiCoder } from 'ethers/utils'
import { TransactionResponse, TransactionRequest, TransactionReceipt } from 'ethers/types';

export interface Provider {
	listAccounts(): Promise<Array<string>>
	send(method: string, params: any): Promise<any>
	sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse>
	call(transaction: TransactionRequest): Promise<string>
	estimateGas(transaction: TransactionRequest): Promise<BigNumber>
	getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>
}

export class LiquidLongDependenciesEthers implements Dependencies<BigNumber> {
	private readonly provider: Provider
	public constructor(provider: Provider) {
		this.provider = provider
	}

	keccak256 = (utf8String: string) => keccak256(toUtf8Bytes(utf8String))
	encodeParams = (abiFunction: AbiFunction, parameters: Array<any>) => new AbiCoder().encode(abiFunction.inputs, parameters).substr(2)
	decodeParams = (abiParameters: Array<AbiParameter>, encoded: string) => new AbiCoder().decode(abiParameters, encoded)
	getDefaultAddress = async () => (await this.provider.listAccounts())[0]
	call = async (transaction: Transaction<BigNumber>) => await this.provider.call(transaction)
	estimateGas = async (transaction: Transaction<BigNumber>) => await this.provider.estimateGas(transaction)
	signTransaction = async (transaction: Transaction<BigNumber>) => (await this.provider.send('eth_signTransaction', [ transaction ])).raw
	sendSignedTransaction = async (signedTransaction: string) => {
		const transactionResponse = await this.provider.sendTransaction(signedTransaction)
		await transactionResponse.wait()
		const transactionReceipt = await this.provider.getTransactionReceipt(transactionResponse.hash!)
		return { status: transactionReceipt.status! }
	}
}
