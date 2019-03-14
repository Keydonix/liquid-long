import { Wallet } from 'ethers/wallet'
import { JsonRpcProvider } from 'ethers/providers'
import { LiquidLong, Address } from './liquid-long'
import { ContractDependenciesEthers } from './liquid-long-ethers-impl'
import { Tub, Sai, Oasis, ProxyRegistry, Gem, Gov } from '@keydonix/maker-contract-interfaces'
import { getEnv } from './Environment';

export class ContractAccessor {
	public readonly provider = new JsonRpcProvider(getEnv('ETHEREUM_HTTP', 'http://localhost:1235'))
	public readonly wallet = new Wallet(getEnv('ETHEREUM_PRIVATE_KEY', 'fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a'), this.provider)
	public readonly dependencies = new ContractDependenciesEthers(this.provider, this.wallet, async () => 1)
	public readonly liquidLong = new LiquidLong(this.dependencies, Address.fromHexString(getEnv('ETHEREUM_LIQUID_LONG_ADDRESS', 'B03CF72BC5A9A344AAC43534D664917927367487')))
	public readonly maker = new Tub(this.dependencies, Address.fromHexString(getEnv('ETHEREUM_MAKER_ADDRESS', '93943fb2d02ce1101dadc3ab1bc3cab723fd19d6')))
	public readonly oasis = new Oasis(this.dependencies, Address.fromHexString(getEnv('ETHEREUM_OASIS_ADDRESS', '3c6721551c2ba3973560aef3e11d34ce05db4047')))
	public readonly proxyRegistry = new ProxyRegistry(this.dependencies, Address.fromHexString(getEnv('ETHEREUM_PROXY_REGISTRY_ADDRESS', '4ddebcebe274751dfb129efc96a588a5242530ab')))
	public readonly dai = new Sai(this.dependencies, Address.fromHexString('8C915Bd2C0df8Ba79A7D28538500a97bD15ea985'))
	public readonly weth = new Gem(this.dependencies, Address.fromHexString('FCaf25bF38E7C86612a25ff18CB8e09aB07c9885'))
	public readonly mkr = new Gov(this.dependencies, Address.fromHexString('25ff5dc79a7c4e34254ff0f4a19d69e491201dd3'))
}
