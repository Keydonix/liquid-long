import { Provider, EthersUtils, EthersProviders } from '@keydonix/liquid-long-client-library/source/liquid-long-ethers-impl'

export const QUINTILLION = EthersUtils.bigNumberify(1e9).mul(1e9)

export class MockProvider implements Provider {
	public accounts: Array<string> = []
	public ethPriceInAttousd: EthersUtils.BigNumber = EthersUtils.bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))
	public providerFeePerEth: EthersUtils.BigNumber = EthersUtils.bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))
	public attodaiPaidCost: EthersUtils.BigNumber = EthersUtils.bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))
	public attoethBoughtCost: EthersUtils.BigNumber = EthersUtils.bigNumberify(QUINTILLION).mul(Math.round(Math.random() * 100 + 1))

	setEthPriceInUsd(value: number) {
		this.ethPriceInAttousd = EthersUtils.bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	setProviderFeePerEth(value: number) {
		this.providerFeePerEth = EthersUtils.bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	setDaiPaidCost(value: number) {
		this.attodaiPaidCost = EthersUtils.bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	setEthBoughtCost(value: number) {
		this.attoethBoughtCost = EthersUtils.bigNumberify(Math.round(value * 1e9)).mul(1e9)
	}

	async listAccounts(): Promise<string[]> {
		return this.accounts
	}
	async call(transaction: EthersProviders.TransactionRequest): Promise<string> {
		// getEthPrice()
		if (transaction.data === '0x683e0bcd') return EthersUtils.defaultAbiCoder.encode(['uint256'], [this.ethPriceInAttousd])
		// providerFeePerEth()
		if (transaction.data === '0xfa72c53e') return EthersUtils.defaultAbiCoder.encode(['uint256'], [this.providerFeePerEth])
		// TODO: make this decode the inputs and compute a reasonable output
		// estimateDaiSaleProceeds(uint256)
		if (typeof transaction.data === 'string' && transaction.data.startsWith('0x5988899c')) return EthersUtils.defaultAbiCoder.encode(['uint256', 'uint256'], [this.attodaiPaidCost, this.attoethBoughtCost])
		throw new Error("Method not implemented.")
	}
	async estimateGas(transaction: EthersProviders.TransactionRequest): Promise<EthersUtils.BigNumber> {
		return new EthersUtils.BigNumber(3000000)
	}
}
