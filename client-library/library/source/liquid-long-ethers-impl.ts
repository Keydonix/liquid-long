import { Dependencies, Transaction, TransactionReceipt, Bytes32, Bytes, Address, DSProxy } from './generated/liquid-long.js'
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
	public constructor(private readonly provider: Provider, private readonly signer: Signer, private readonly getGasPrice: () => Promise<number>) {}

	call = async (transaction: Transaction<ethers.utils.BigNumber>): Promise<Uint8Array> => {
		const ethersTransaction: ethers.providers.TransactionRequest = {
			from: await this.getSignerOrZero(),
			to: transaction.to.to0xString(),
			data: transaction.data.to0xString(),
			value: transaction.value
		}
		const stringResult = await this.provider.call(ethersTransaction)
		return Bytes.fromHexString(stringResult)
	}

	submitTransaction = async (transaction: Transaction<ethers.utils.BigNumber>): Promise<TransactionReceipt> => {
		const ethersTransaction: ethers.providers.TransactionRequest = {
			from: await this.signer.getAddress(),
			to: transaction.to.to0xString(),
			data: transaction.data.to0xString(),
			value: transaction.value
		}
		const gasEstimate = (await this.provider.estimateGas(ethersTransaction)).toNumber()
		// https://github.com/ethers-io/ethers.js/issues/321
		delete ethersTransaction.from
		// TODO: figure out a way to propagate a warning up to the user when we truncate the gas estimate, we don't currently have a mechanism for error propagation, so will require infrastructure work
		ethersTransaction.gasLimit = Math.min(Math.max(Math.round(gasEstimate * 1.3), 250000), 5000000)
		ethersTransaction.gasPrice = ethers.utils.bigNumberify(await this.getGasPrice() * 1e9)
		const ethersReceipt = await (await this.signer.sendTransaction(ethersTransaction)).wait()
		// ethers has `status` on the receipt as optional, even though it isn't and never will be undefined if using a modern network (which this is designed for)
		const receipt: TransactionReceipt = {
			success: !!ethersReceipt.status,
			events: ethersReceipt.logs!.map(ethersEvent => ({
				topics: ethersEvent.topics.map(ethersTopic => Bytes32.fromHexString(ethersTopic)),
				data: Bytes.fromHexString(ethersEvent.data)
			}))
		}
		return receipt
	}

	isLargeInteger = (x: any): x is ethers.utils.BigNumber => x instanceof ethers.utils.BigNumber

	encodeLargeUnsignedInteger = (x: ethers.utils.BigNumber): Bytes32 => {
		const value = x as any as ethers.utils.BigNumber
		const result = new Bytes32()
		const stringified = ('0000000000000000000000000000000000000000000000000000000000000000' + value.toHexString().substring(2)).slice(-64)
		for (let i = 0; i < stringified.length; i += 2) {
			result[i/2] = Number.parseInt(stringified[i] + stringified[i+1], 16)
		}
		return result
	}

	encodeLargeSignedInteger = (x: ethers.utils.BigNumber): Bytes32 => {
		const value = x as any as ethers.utils.BigNumber
		const result = new Bytes32()
		const stringified = ('0000000000000000000000000000000000000000000000000000000000000000' + value.toTwos(256).toHexString().substring(2)).slice(-64)
		for (let i = 0; i < stringified.length; i += 2) {
			result[i/2] = Number.parseInt(stringified[i] + stringified[i+1], 16)
		}
		return result
	}

	decodeLargeUnsignedInteger = (data: Bytes32): ethers.utils.BigNumber => new ethers.utils.BigNumber(data)

	decodeLargeSignedInteger = (data: Bytes32): ethers.utils.BigNumber => new ethers.utils.BigNumber(data).fromTwos(256)

	/**
	 * Get the address of the signer, or zero if the signer address can't be fetched (for example, if privacy mode is enabled in the signing tool).
	 *
	 * FIXME: some functions may require a legitimate from address, while others do not. this information is known by the developer who calls the contract, but not known to the rest of the system. we need a way for the caller to specify, 'if a user address is not available, then fail, otherwise use the 0 address'
	 */
	private getSignerOrZero = async () => {
		try {
			return await this.signer.getAddress()
		} catch (error) {
			return new Address().to0xString()
		}
	}
}

/**
 * This set of dependencies wraps another set of dependencies but stashes the raw response from call and sendTransaction.  This is useful if you want to create something like the delegating dependencies which need to propogate out low-level responses rather than using the high level decoded response.  This class is not safe to be used concurrently (results will overwrite each other) so it is designed to throw if you _ever_ make two calls with it.  Instantiation of this is very cheap, and it doesn't pin itself so just new up one of these anytime you need to use it then discard it as soon as you have used it once.
 */
class StashingContractDependenciesEthers implements Dependencies<ethers.utils.BigNumber> {
	public lastCallResult?: Uint8Array
	public lastSendResult?: TransactionReceipt

	public constructor(private readonly contractDependencies: ContractDependenciesEthers) {}
	call = async (transaction: Transaction<ethers.utils.BigNumber>): Promise<Uint8Array> => {
		this.lastCallResult = await this.contractDependencies.call(transaction)
		return this.lastCallResult
	}
	submitTransaction = async (transaction: Transaction<ethers.utils.BigNumber>): Promise<TransactionReceipt> => {
		this.lastSendResult = await this.contractDependencies.submitTransaction(transaction)
		return this.lastSendResult
	}
	isLargeInteger = this.contractDependencies.isLargeInteger
	encodeLargeUnsignedInteger = this.contractDependencies.encodeLargeUnsignedInteger
	encodeLargeSignedInteger = this.contractDependencies.encodeLargeSignedInteger
	decodeLargeUnsignedInteger = this.contractDependencies.decodeLargeUnsignedInteger
	decodeLargeSignedInteger = this.contractDependencies.decodeLargeSignedInteger
}

/**
 * This set of dependencies has code to make it so calls to `closeCdp(LiquidLong _liquidLong, uint256 _cdpId, uint256 _minimumValueInAttoeth)` will be converted to a proxy call through the provided delegator adderss using DSProxy.execute.  This class should be used once and then discarded due to `StashingContractDependenciesEthers` which isn't safe to be called multiple times concurrently, so it will throw if it is ever called twice.
 */
export class CloseDelegatingContractDependenciesEthers implements Dependencies<ethers.utils.BigNumber> {
	private readonly stashingContractDependencies: StashingContractDependenciesEthers
	private burned = false
	public constructor(private readonly contractDependencies: ContractDependenciesEthers, private readonly delegatorAddress: Address) {
		this.stashingContractDependencies = new StashingContractDependenciesEthers(contractDependencies)
	}

	call = async (transaction: Transaction<ethers.utils.BigNumber>): Promise<Uint8Array> => {
		// 082a7f79 is the signature hash for closeCdp(address,uint256,uint256,address) method
		if (transaction.data.toString().startsWith('46fde171')) {
			if (this.burned) throw new Error(`CloseDelegatingContractDependencies is designed to be used once and then discarded, you should not use it for multiple calls.`)
			this.burned = true
			const proxy = new DSProxy(this.stashingContractDependencies, this.delegatorAddress)
			await proxy.execute_(transaction.to, transaction.data, transaction.value)
			return this.stashingContractDependencies.lastCallResult!
		}
		return await this.stashingContractDependencies.call(transaction)
	}
	submitTransaction = async (transaction: Transaction<ethers.utils.BigNumber>): Promise<TransactionReceipt>  => {
		// 082a7f79 is the signature hash for closeCdp(address,uint256,uint256,address) method
		if (transaction.data.toString().startsWith('46fde171')) {
			if (this.burned) throw new Error(`CloseDelegatingContractDependencies is designed to be used once and then discarded, you should not use it for multiple calls.`)
			this.burned = true
			const proxy = new DSProxy(this.stashingContractDependencies, this.delegatorAddress)
			await proxy.execute(transaction.to, transaction.data, transaction.value)
			return this.stashingContractDependencies.lastSendResult!
		}
		return await this.stashingContractDependencies.submitTransaction(transaction)
	}
	isLargeInteger = this.contractDependencies.isLargeInteger
	encodeLargeUnsignedInteger = this.contractDependencies.encodeLargeUnsignedInteger
	encodeLargeSignedInteger = this.contractDependencies.encodeLargeSignedInteger
	decodeLargeUnsignedInteger = this.contractDependencies.decodeLargeUnsignedInteger
	decodeLargeSignedInteger = this.contractDependencies.decodeLargeSignedInteger
}
