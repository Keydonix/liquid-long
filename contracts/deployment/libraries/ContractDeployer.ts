import { Address } from './Address'
import { ByteArray } from './ByteArray';
import { PrivateKey } from './PrivateKey'
import { Abi } from 'ethereum';
import { Wallet, providers, Contract } from 'ethers'

export class ContractDeployer {
	private readonly bytecode: ByteArray
	private readonly abi: Abi
	private readonly wallet: Wallet
	private readonly provider: providers.Provider
	private readonly gasPrice: number

	public constructor(jsonRpcEndpoint: string, gasPriceInNanoeth: number, privateKey: PrivateKey, abi: Abi, bytecode: ByteArray) {
		this.abi = abi
		this.bytecode = bytecode
		this.provider = new providers.JsonRpcProvider(jsonRpcEndpoint, 4173)
		this.wallet = new Wallet(privateKey.toHexStringWithPrefix(), this.provider)
		this.gasPrice = gasPriceInNanoeth * 10**9
	}

	public async deploy(oasisAddress: Address, makerAddress: Address): Promise<Address> {
		const contract = await new Contract('', JSON.stringify(this.abi), this.wallet).deploy(this.bytecode.toHexStringWithPrefix(), oasisAddress.toHexStringWithPrefix(), makerAddress.toHexStringWithPrefix())
		return Address.fromHexString(contract.address)
	}
}
