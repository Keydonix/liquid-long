import { Address } from './Address'
import { ByteArray } from './ByteArray';
import { PrivateKey } from './PrivateKey'
import { Abi } from 'ethereum';
import { CompilerOutput } from 'solc'
import fetch from 'node-fetch'
import { Headers } from 'node-fetch'
import { Wallet, providers, Transaction, Contract, utils } from 'ethers'

export class ContractDeployer {
	private readonly bytecode: ByteArray
	private readonly abi: Abi
	private readonly wallet: Wallet
	private readonly provider: providers.Provider
	private readonly gasPrice: number

	public constructor(jsonRpcEndpoint: string, gasPriceInNanoeth: number, privateKey: PrivateKey, abi: Abi, bytecode: ByteArray) {
		this.abi = abi
		this.bytecode = bytecode
		this.provider = new providers.JsonRpcProvider(jsonRpcEndpoint, { chainId: 17, ensAddress: '', name: 'instaseal' })
		this.wallet = new Wallet(privateKey.toHexStringWithPrefix(), this.provider)
		this.gasPrice = gasPriceInNanoeth * 10**9
	}

	public async deploy(oasisAddress: Address, makerAddress: Address): Promise<Address> {
		const transactionToDeploy = Contract.getDeployTransaction(this.bytecode.toHexStringWithPrefix(), JSON.stringify(this.abi), oasisAddress.toHexStringWithPrefix(), makerAddress.toHexStringWithPrefix())
		transactionToDeploy.gasPrice = utils.bigNumberify(this.gasPrice)
		const transaction = await this.wallet.sendTransaction(transactionToDeploy)
		if (transaction === undefined) throw new Error(`deployment transaction failed:\n${transactionToDeploy}`)
		const transactionReceipt = await this.provider.getTransactionReceipt(transaction.hash!)
		if (transactionReceipt.contractAddress === null) throw new Error('Transaction receipt has no contractAddress')
		return Address.fromHexString(transactionReceipt.contractAddress)
	}
}
