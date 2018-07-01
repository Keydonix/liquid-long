import 'mocha'
import { expect } from 'chai'
import { utils } from 'ethers'
import { TransactionResponse, TransactionRequest, TransactionReceipt } from 'ethers/providers/provider'
import { LiquidLong } from '../source/index'
import { Provider } from '../source/liquid-long-ethers-impl'

const QUINTILLION = utils.bigNumberify(1e9).mul(1e9)

class MockProvider implements Provider {
	public accounts: Array<string> = []
	public ethPrice: utils.BigNumber = utils.bigNumberify(1)

	async listAccounts(): Promise<string[]> {
		return this.accounts
	}
	async send(method: string, params: any): Promise<any> {
		throw new Error("Method not implemented.")
	}
	async sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse> {
		throw new Error("Method not implemented.")
	}
	async call(transaction: TransactionRequest): Promise<string> {
		// getEthPrice()
		if (transaction.data === '0x683e0bcd') return utils.defaultAbiCoder.encode(['uint256'], [this.ethPrice]);
		throw new Error("Method not implemented.")
	}
	async estimateGas(transaction: TransactionRequest): Promise<utils.BigNumber> {
		throw new Error("Method not implemented.")
	}
	async getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt> {
		throw new Error("Method not implemented.")
	}
}

describe('LiquidLong', async () => {
	const mockProvider = new MockProvider()
	const liquidLong = new LiquidLong('0x0000000000000000000000000000000000000000', mockProvider)

	describe('getEthPrice', async () => {
		it('should return floating point number representation', async () => {
			mockProvider.ethPrice = utils.bigNumberify(54321).mul(QUINTILLION).div(100)

			const ethPriceInUsd = await liquidLong.getEthPriceInUsd()

			expect(ethPriceInUsd).to.equal(543.21)
		})
	})
})
