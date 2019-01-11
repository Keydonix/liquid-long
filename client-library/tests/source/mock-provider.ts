import { Provider } from '@keydonix/liquid-long-client-library/source/liquid-long-ethers-impl'
import { ethers } from 'ethers'


export const QUINTILLION = ethers.utils.bigNumberify(1e9).mul(1e9)

export class MockProvider implements Provider {
	public accounts: Array<string> = []
	public ethPriceInAttousd: ethers.utils.BigNumber = ethers.utils.bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))
	public providerFeePerEth: ethers.utils.BigNumber = ethers.utils.bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))
	public attodaiPaidCost: ethers.utils.BigNumber = ethers.utils.bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))
	public attoethBoughtCost: ethers.utils.BigNumber = ethers.utils.bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))

	setEthPriceInUsd(value: number) {
		this.ethPriceInAttousd = ethers.utils.bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	setProviderFeePerEth(value: number) {
		this.providerFeePerEth = ethers.utils.bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	setDaiPaidCost(value: number) {
		this.attodaiPaidCost = ethers.utils.bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	setEthBoughtCost(value: number) {
		this.attoethBoughtCost = ethers.utils.bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	async listAccounts(): Promise<string[]> {
		return this.accounts
	}
	async call(transaction: ethers.providers.TransactionRequest): Promise<string> {
		// getEthPrice()
		if (transaction.data === '0x683e0bcd') return ethers.utils.defaultAbiCoder.encode(['uint256'], [this.ethPriceInAttousd])
		// providerFeePerEth()
		if (transaction.data === '0xfa72c53e') return ethers.utils.defaultAbiCoder.encode(['uint256'], [this.providerFeePerEth])
		// TODO: make this decode the inputs and compute a reasonable output
		// estimateDaiSaleProceeds(uint256)
		if (typeof transaction.data === 'string' && transaction.data.startsWith('0x5988899c')) return ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [this.attodaiPaidCost, this.attoethBoughtCost])
		throw new Error("Method not implemented.")
	}
	async estimateGas(transaction: ethers.providers.TransactionRequest): Promise<ethers.utils.BigNumber> {
		return new ethers.utils.BigNumber(3000000)
	}

	async getTransactionCount(address: string): Promise<number> {
		return 0;
	}
}
