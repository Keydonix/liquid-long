import { PrivateKey } from '../libraries/PrivateKey'
import { OasisdexContract } from '../libraries/ContractInterfaces'
import { getEnv } from '../libraries/Environment'
import { JsonRpcProvider } from 'ethers/providers'
import { Wallet } from 'ethers/wallet'
import { BigNumber, bigNumberify } from 'ethers/utils'

// TODO: read off Maker from env
const DAI_ADDRESS = "0x8c915bd2c0df8ba79a7d28538500a97bd15ea985"
const WETH_ADDRESS = "0xfcaf25bf38e7c86612a25ff18cb8e09ab07c9885"

const ZERO = bigNumberify(0)
const ETHER = bigNumberify(10).pow(bigNumberify(18))

enum OrderType {
	BID,
	ASK,
}

async function placeMultipleEqualOrders(od: OasisdexContract, orderType: OrderType, startPrice: BigNumber, endPrice: BigNumber, ethAmount: BigNumber, orderCount: number) {
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
	// gather/validate inputs
	const jsonRpcAddress = getEnv('ETHEREUM_HTTP', 'http://localhost:1235')
	const gasPriceInNanoeth = parseInt(getEnv('ETHEREUM_GAS_PRICE_IN_NANOETH', '1'), 10)
	const oasisAddress = getEnv('ETHEREUM_OASIS_ADDRESS', '0x3c6721551c2ba3973560aef3e11d34ce05db4047')
	const privateKey = PrivateKey.fromHexString(getEnv('ETHEREUM_PRIVATE_KEY', 'fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a'))

	const provider = new JsonRpcProvider(jsonRpcAddress, 4173)
	const wallet = new Wallet(privateKey.toHexStringWithPrefix(), provider)

	const od = new OasisdexContract(oasisAddress, wallet, gasPriceInNanoeth)

	// TODO: check approvals/approve
	console.log("Sending offer...")
	await placeMultipleEqualOrders(od, OrderType.ASK, bigNumberify(601), bigNumberify(625), bigNumberify(20).mul(ETHER), 3)
	await placeMultipleEqualOrders(od, OrderType.BID, bigNumberify(575), bigNumberify(595), bigNumberify(20).mul(ETHER), 4)
	console.log("Sent")
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
