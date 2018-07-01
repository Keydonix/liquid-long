import { LiquidLong as LiquidLongContract } from './generated/liquid-long'
import { LiquidLongDependenciesEthers, Provider } from './liquid-long-ethers-impl'
import { BigNumber, bigNumberify } from 'ethers/utils'

export class LiquidLong {
	private readonly contract: LiquidLongContract<BigNumber>

	public constructor(liquidLongAddress: string, provider: Provider) {
		this.contract = new LiquidLongContract(new LiquidLongDependenciesEthers(provider), liquidLongAddress, bigNumberify(1e9))
	}

	getEthPriceInUsd = async () => {
		const attousd = await this.contract.ethPriceInUsd_()
		return attousd.div(1e9).toNumber() / 1e9
	}

	// target_price = current_price * (1 + target_percentage / multiplier)
	// percent_of_current_price_that_liquidation_occurs_at = 1.5 - 1 / multiplier
}
