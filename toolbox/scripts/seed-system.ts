import { ContractAccessor } from '../libraries/ContractAccessort'
import { BigNumber, bigNumberify } from 'ethers/utils'
import { Oasis } from '@keydonix/maker-contract-interfaces';

// TODO: read off Maker from env
const DAI_ADDRESS = "0x8c915bd2c0df8ba79a7d28538500a97bd15ea985"
const WETH_ADDRESS = "0xfcaf25bf38e7c86612a25ff18cb8e09ab07c9885"

const ZERO = bigNumberify(0)
const ETHER = bigNumberify(10).pow(bigNumberify(18))

enum OrderType {
	BID,
	ASK,
}

async function placeMultipleEqualOrders(od: Oasis<BigNumber>, orderType: OrderType, startPrice: BigNumber, endPrice: BigNumber, ethAmount: BigNumber, orderCount: number) {
	const [payToken, buyToken] = (orderType == OrderType.ASK) ? [WETH_ADDRESS, DAI_ADDRESS] : [DAI_ADDRESS, WETH_ADDRESS]

	const priceDelta = endPrice.sub(startPrice)
	const orderEth = ethAmount.div(bigNumberify(orderCount))
	for (let i = 0; i < orderCount; ++i) {
		const orderPrice = startPrice.add(priceDelta.mul(bigNumberify(i)).div(bigNumberify(orderCount - 1)))
		const orderDai = orderEth.mul(orderPrice)

		const [payAmount, buyAmount] = (orderType == OrderType.ASK) ? [orderEth, orderDai] : [orderDai, orderEth]
		console.log(`Placing ${orderType === OrderType.ASK ? "ask" : "bid"} order for ${orderEth.div(ETHER).toString()} @ ${orderPrice.toString()}`)
		await od.offer(payAmount, payToken, buyAmount, buyToken, ZERO)
	}
}

async function doStuff() {
	const contracts = new ContractAccessor()

	console.log('Sweeping Liquid Long ...')
	const wethBalance = await contracts.weth.balanceOf_(contracts.liquidLong.address)
	await contracts.liquidLong.wethWithdraw(wethBalance)

	console.log('Clearing Oasis orderbook...')
	await clearOasisOrderbook(contracts.oasis, await contracts.liquidLong.weth_(), await contracts.liquidLong.dai_())

	console.log('Adding ETH to Liquid Long...')
	await contracts.liquidLong.wethDeposit({ attachedEth: ETHER.mul(100) })

	// TODO: check approvals/approve
	console.log("Creating Oasis orders...")
	await placeMultipleEqualOrders(contracts.oasis, OrderType.ASK, bigNumberify(601), bigNumberify(625), bigNumberify(20).mul(ETHER), 3)
	await placeMultipleEqualOrders(contracts.oasis, OrderType.BID, bigNumberify(575), bigNumberify(595), bigNumberify(20).mul(ETHER), 4)
}

const clearOasisOrderbook = async (oasis: Oasis<BigNumber>, wethAddress: string, daiAddress: string) => {
	while (true) {
		const bestOfferId = await oasis.getBestOffer_(wethAddress, daiAddress)
		if (bestOfferId.isZero()) break
		await oasis.cancel(bestOfferId)
	}
	while (true) {
		const bestOfferId = await oasis.getBestOffer_(daiAddress, wethAddress)
		if (bestOfferId.isZero()) break
		await oasis.cancel(bestOfferId)
	}
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
