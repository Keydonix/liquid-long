import { Dependencies, AbiFunction, AbiParameter, Transaction, TransactionReceipt } from '@keydonix/maker-contract-interfaces'
import { JsonRpcProvider } from 'ethers/providers'
import { keccak256, toUtf8Bytes, BigNumber, AbiCoder } from 'ethers/utils'
import * as Ethers from 'ethers'

export class ContractDependenciesEthers implements Dependencies<BigNumber> {

	public constructor(private readonly provider: JsonRpcProvider, private readonly signer: Ethers.Signer) {}

	keccak256 = (utf8String: string) => keccak256(toUtf8Bytes(utf8String))
	encodeParams = (abiFunction: AbiFunction, parameters: Array<any>) => new AbiCoder().encode(abiFunction.inputs, parameters).substr(2)
	decodeParams = (abiParameters: Array<AbiParameter>, encoded: string) => new AbiCoder().decode(abiParameters, encoded)
	getDefaultAddress = async () => (await this.provider.listAccounts())[0]
	call = async (transaction: Transaction<BigNumber>) => await this.provider.call(transaction)
	submitTransaction = async (transaction: Transaction<BigNumber>) => {
		// https://github.com/ethers-io/ethers.js/issues/321
		const gasEstimate = (await this.provider.estimateGas(transaction)).toNumber()
		const gasLimit = Math.min(Math.max(Math.round(gasEstimate * 1.3), 250000), 5000000)
		// TODO: figure out a way to propagate a warning up to the user in this scenario, we don't currently have a mechanism for error propagation, so will require infrastructure work
		transaction = Object.assign({}, transaction, { gasLimit: gasLimit })
		delete transaction.from
		const receipt = await (await this.signer.sendTransaction(transaction)).wait()
		// ethers has `status` on the receipt as optional, even though it isn't and never will be undefined if using a modern network (which this is designed for)
		return <TransactionReceipt>receipt
	}
}
