import { Dependencies, AbiFunction, AbiParameter, Transaction, TransactionReceipt } from './generated/liquid-long'
import { ethers } from 'ethers'


export interface Provider {
	listAccounts(): Promise<Array<string>>
	call(transaction: ethers.providers.TransactionRequest): Promise<string>
	estimateGas(transaction: ethers.providers.TransactionRequest): Promise<ethers.utils.BigNumber>
	getTransactionCount(address: string): Promise<number>
}

export interface Signer {
	getAddress(): Promise<string>;
	sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse>;
}

export class ContractDependenciesEthers implements Dependencies<ethers.utils.BigNumber> {
	public constructor(private readonly provider: Provider, private readonly signer: Signer, private readonly gasPriceInNanoeth: number) {}

	keccak256 = (utf8String: string) => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(utf8String))
	encodeParams = (abiFunction: AbiFunction, parameters: Array<any>) => new ethers.utils.AbiCoder().encode(abiFunction.inputs, parameters).substr(2)
	decodeParams = (abiParameters: Array<AbiParameter>, encoded: string) => new ethers.utils.AbiCoder().decode(abiParameters, encoded)
	getDefaultAddress = async () => await this.signer.getAddress()
	call = async (transaction: Transaction<ethers.utils.BigNumber>) => await this.provider.call(transaction)
	submitTransaction = async (transaction: Transaction<ethers.utils.BigNumber>) => {
		// https://github.com/ethers-io/ethers.js/issues/321
		const gasEstimate = (await this.provider.estimateGas(transaction)).toNumber()
		const gasLimit = Math.min(Math.max(Math.round(gasEstimate * 1.3), 250000), 5000000)
		const gasPrice = ethers.utils.bigNumberify(this.gasPriceInNanoeth * 1e9)
		transaction = Object.assign({}, transaction, { gasLimit: gasLimit, gasPrice: gasPrice})
		delete transaction.from
		const receipt = await (await this.signer.sendTransaction(transaction)).wait()
		// ethers has `status` on the receipt as optional, even though it isn't and never will be undefined if using a modern network (which this is designed for)
		return <TransactionReceipt>receipt
	}
}
