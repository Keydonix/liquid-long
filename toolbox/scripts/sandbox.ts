import { ContractAccessor } from '../libraries/ContractAccessort';
import { bigNumberify } from 'ethers/utils';

const ETH = bigNumberify('1000000000000000000')
const NETH = bigNumberify('1000000000')

async function doStuff() {
	const contracts = new ContractAccessor()

	const multiplier = bigNumberify(200)
	const amount = ETH
	const fee = await contracts.liquidLong.providerFeePerEth_()
	const cost = ETH.sub((await contracts.liquidLong.estimateDaiSaleProceeds_(ETH.mul(600)))._wethBought)
	const attached = amount.add(fee).add(cost)
	const affiliate = '0000000000000000000000000000000000000000'
	const logs = await contracts.liquidLong.openCdp(multiplier, amount, fee, affiliate, { attachedEth: attached })

	// const result = await contracts.proxyRegistry.proxies_(contracts.wallet.address)
	// const logs = await contracts.proxyRegistry.build(await contracts.wallet.address)
	// const ethPrice = await liquidLong.ethPriceInUsd_()
	// console.log(ethPrice.toString())
	console.log(logs)
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
