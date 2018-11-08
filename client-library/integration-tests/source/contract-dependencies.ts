import { Dependencies, AbiFunction, AbiParameter, Transaction } from '@keydonix/maker-contract-interfaces'
import { keccak256, toUtf8Bytes, BigNumber, AbiCoder } from 'ethers/utils'
import { Provider, Signer } from '@keydonix/liquid-long-client-library'

export class ContractDependenciesEthers implements Dependencies<BigNumber> {
	private readonly provider: Provider
	private readonly signer: Signer
	public constructor(provider: Provider, signer: Signer) {
		this.provider = provider
		this.signer = signer
	}

	keccak256 = (utf8String: string) => keccak256(toUtf8Bytes(utf8String))
	encodeParams = (abiFunction: AbiFunction, parameters: Array<any>) => new AbiCoder().encode(abiFunction.inputs, parameters).substr(2)
	decodeParams = (abiParameters: Array<AbiParameter>, encoded: string) => new AbiCoder().decode(abiParameters, encoded)
	getDefaultAddress = async () => (await this.provider.listAccounts())[0]
	call = async (transaction: Transaction<BigNumber>) => await this.provider.call(transaction)
	submitTransaction = async (transaction: Transaction<BigNumber>) => {
		// https://github.com/ethers-io/ethers.js/issues/321
		transaction = Object.assign({}, transaction)
		delete transaction.from
		return { status: (await (await this.signer.sendTransaction(transaction)).wait()).status! }
	}
}
