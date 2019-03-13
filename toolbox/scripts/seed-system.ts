import { ContractAccessor } from '../libraries/ContractAccessor'
import { BigNumber, bigNumberify } from 'ethers/utils'
import { Oasis, Address } from '@keydonix/maker-contract-interfaces';

const ZERO = bigNumberify(0)
const ETHER = bigNumberify(10).pow(bigNumberify(18))
const contracts = new ContractAccessor()

enum OrderType {
	BID,
	ASK,
}

async function placeMultipleEqualOrders(od: Oasis<BigNumber>, orderType: OrderType, startPrice: BigNumber, endPrice: BigNumber, ethAmount: BigNumber, orderCount: number) {
	const [payToken, buyToken] = (orderType == OrderType.ASK) ? [contracts.weth.address, contracts.dai.address] : [contracts.dai.address, contracts.weth.address]

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
	console.log('Sweeping WETH ...')
	const wethBalance = await contracts.weth.balanceOf_(contracts.liquidLong.address)
	await contracts.liquidLong.wethWithdraw(wethBalance)

	console.log('Sweeping MKR...')
	await contracts.liquidLong.transferTokens(contracts.mkr.address)

	console.log('Clearing Oasis orderbook...')
	await clearOasisOrderbook(contracts.oasis, await contracts.liquidLong.weth_(), await contracts.liquidLong.dai_())

	console.log('Adding ETH to Liquid Long...')
	await contracts.liquidLong.wethDeposit(ETHER.mul(100))

	console.log('Adding MKR to Liquid Long...')
	await contracts.mkr.mint(contracts.liquidLong.address, ETHER.mul(100))


	// TODO: check approvals/approve
	console.log("Creating Oasis orders...")
	await placeMultipleEqualOrders(contracts.oasis, OrderType.ASK, bigNumberify(601), bigNumberify(625), bigNumberify(20).mul(ETHER), 3)
	await placeMultipleEqualOrders(contracts.oasis, OrderType.BID, bigNumberify(575), bigNumberify(595), bigNumberify(20).mul(ETHER), 4)
}

const clearOasisOrderbook = async (oasis: Oasis<BigNumber>, wethAddress: Address, daiAddress: Address) => {
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
