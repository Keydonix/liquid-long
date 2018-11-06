import { Provider } from '@keydonix/liquid-long-client-library'
import { BigNumber, bigNumberify, defaultAbiCoder } from 'ethers/utils'
import { TransactionRequest } from 'ethers/providers'

export const QUINTILLION = bigNumberify(1e9).mul(1e9)

export class MockProvider implements Provider {
	public accounts: Array<string> = []
	public ethPriceInAttousd: BigNumber = bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))
	public providerFeePerEth: BigNumber = bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))
	public attodaiPaidCost: BigNumber = bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))
	public attoethBoughtCost: BigNumber = bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))

	setEthPriceInUsd(value: number) {
		this.ethPriceInAttousd = bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	setProviderFeePerEth(value: number) {
		this.providerFeePerEth = bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	setDaiPaidCost(value: number) {
		this.attodaiPaidCost = bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	setEthBoughtCost(value: number) {
		this.attoethBoughtCost = bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	async listAccounts(): Promise<string[]> {
		return this.accounts
	}
	async call(transaction: TransactionRequest): Promise<string> {
		// getEthPrice()
		if (transaction.data === '0x683e0bcd') return defaultAbiCoder.encode(['uint256'], [this.ethPriceInAttousd])
		// providerFeePerEth()
		if (transaction.data === '0xfa72c53e') return defaultAbiCoder.encode(['uint256'], [this.providerFeePerEth])
		// TODO: make this decode the inputs and compute a reasonable output
		// estimateDaiSaleProceeds(uint256)
		if (typeof transaction.data === 'string' && transaction.data.startsWith('0x5988899c')) return defaultAbiCoder.encode(['uint256', 'uint256'], [this.attodaiPaidCost, this.attoethBoughtCost])
		throw new Error("Method not implemented.")
	}
}
