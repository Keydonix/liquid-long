import {Wallet, Contract, utils} from 'ethers'
import BN = require('bn.js');

const oasisAbi = [{"constant": true, "inputs": [], "name": "matchingEnabled", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "sell_gem", "type": "address"}, {"name": "buy_gem", "type": "address"}], "name": "getBestOffer", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "pay_gem", "type": "address"}, {"name": "pay_amt", "type": "uint256"}, {"name": "buy_gem", "type": "address"}, {"name": "min_fill_amount", "type": "uint256"}], "name": "sellAllAmount", "outputs": [{"name": "fill_amt", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [], "name": "stop", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "pay_gem", "type": "address"}, {"name": "buy_gem", "type": "address"}, {"name": "pay_amt", "type": "uint128"}, {"name": "buy_amt", "type": "uint128"}], "name": "make", "outputs": [{"name": "", "type": "bytes32"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "owner_", "type": "address"}], "name": "setOwner", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [{"name": "buy_gem", "type": "address"}, {"name": "pay_gem", "type": "address"}, {"name": "pay_amt", "type": "uint256"}], "name": "getBuyAmount", "outputs": [{"name": "fill_amt", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "baseToken", "type": "address"}, {"name": "quoteToken", "type": "address"}], "name": "addTokenPairWhitelist", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "baseToken", "type": "address"}, {"name": "quoteToken", "type": "address"}], "name": "remTokenPairWhitelist", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "pay_amt", "type": "uint256"}, {"name": "pay_gem", "type": "address"}, {"name": "buy_amt", "type": "uint256"}, {"name": "buy_gem", "type": "address"}, {"name": "pos", "type": "uint256"}], "name": "offer", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "id", "type": "uint256"}, {"name": "pos", "type": "uint256"}], "name": "insert", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "last_offer_id", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "matchingEnabled_", "type": "bool"}], "name": "setMatchingEnabled", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "id", "type": "uint256"}], "name": "cancel", "outputs": [{"name": "success", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [{"name": "id", "type": "uint256"}], "name": "getOffer", "outputs": [{"name": "", "type": "uint256"}, {"name": "", "type": "address"}, {"name": "", "type": "uint256"}, {"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "id", "type": "uint256"}], "name": "del_rank", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "id", "type": "bytes32"}, {"name": "maxTakeAmount", "type": "uint128"}], "name": "take", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [{"name": "pay_gem", "type": "address"}], "name": "getMinSell", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "getTime", "outputs": [{"name": "", "type": "uint64"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "id", "type": "uint256"}], "name": "getNextUnsortedOffer", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "close_time", "outputs": [{"name": "", "type": "uint64"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "address"}, {"name": "", "type": "address"}], "name": "_span", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "address"}, {"name": "", "type": "address"}], "name": "_best", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "stopped", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "id_", "type": "bytes32"}], "name": "bump", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "authority_", "type": "address"}], "name": "setAuthority", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [{"name": "sell_gem", "type": "address"}, {"name": "buy_gem", "type": "address"}], "name": "getOfferCount", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "buy_gem", "type": "address"}, {"name": "buy_amt", "type": "uint256"}, {"name": "pay_gem", "type": "address"}, {"name": "max_fill_amount", "type": "uint256"}], "name": "buyAllAmount", "outputs": [{"name": "fill_amt", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [{"name": "id", "type": "uint256"}], "name": "isActive", "outputs": [{"name": "active", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "uint256"}], "name": "offers", "outputs": [{"name": "pay_amt", "type": "uint256"}, {"name": "pay_gem", "type": "address"}, {"name": "buy_amt", "type": "uint256"}, {"name": "buy_gem", "type": "address"}, {"name": "owner", "type": "address"}, {"name": "timestamp", "type": "uint64"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "getFirstUnsortedOffer", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "baseToken", "type": "address"}, {"name": "quoteToken", "type": "address"}], "name": "isTokenPairWhitelisted", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "owner", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "id", "type": "uint256"}], "name": "getBetterOffer", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "address"}], "name": "_dust", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "id", "type": "uint256"}], "name": "getWorseOffer", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "bytes32"}], "name": "_menu", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "uint256"}], "name": "_near", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "id", "type": "bytes32"}], "name": "kill", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "pay_gem", "type": "address"}, {"name": "dust", "type": "uint256"}], "name": "setMinSell", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "authority", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "isClosed", "outputs": [{"name": "closed", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "uint256"}], "name": "_rank", "outputs": [{"name": "next", "type": "uint256"}, {"name": "prev", "type": "uint256"}, {"name": "delb", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "id", "type": "uint256"}], "name": "getOwner", "outputs": [{"name": "owner", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "id", "type": "uint256"}], "name": "isOfferSorted", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "buyEnabled_", "type": "bool"}], "name": "setBuyEnabled", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "id", "type": "uint256"}, {"name": "amount", "type": "uint256"}], "name": "buy", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "pay_amt", "type": "uint256"}, {"name": "pay_gem", "type": "address"}, {"name": "buy_amt", "type": "uint256"}, {"name": "buy_gem", "type": "address"}, {"name": "pos", "type": "uint256"}, {"name": "rounding", "type": "bool"}], "name": "offer", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "pay_amt", "type": "uint256"}, {"name": "pay_gem", "type": "address"}, {"name": "buy_amt", "type": "uint256"}, {"name": "buy_gem", "type": "address"}], "name": "offer", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "buyEnabled", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "pay_gem", "type": "address"}, {"name": "buy_gem", "type": "address"}, {"name": "buy_amt", "type": "uint256"}], "name": "getPayAmount", "outputs": [{"name": "fill_amt", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"inputs": [{"name": "close_time", "type": "uint64"}], "payable": false, "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": true, "inputs": [{"indexed": true, "name": "sig", "type": "bytes4"}, {"indexed": true, "name": "guy", "type": "address"}, {"indexed": true, "name": "foo", "type": "bytes32"}, {"indexed": true, "name": "bar", "type": "bytes32"}, {"indexed": false, "name": "wad", "type": "uint256"}, {"indexed": false, "name": "fax", "type": "bytes"}], "name": "LogNote", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "id", "type": "uint256"}], "name": "LogItemUpdate", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "pay_amt", "type": "uint256"}, {"indexed": true, "name": "pay_gem", "type": "address"}, {"indexed": false, "name": "buy_amt", "type": "uint256"}, {"indexed": true, "name": "buy_gem", "type": "address"}], "name": "LogTrade", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "id", "type": "bytes32"}, {"indexed": true, "name": "pair", "type": "bytes32"}, {"indexed": true, "name": "maker", "type": "address"}, {"indexed": false, "name": "pay_gem", "type": "address"}, {"indexed": false, "name": "buy_gem", "type": "address"}, {"indexed": false, "name": "pay_amt", "type": "uint128"}, {"indexed": false, "name": "buy_amt", "type": "uint128"}, {"indexed": false, "name": "timestamp", "type": "uint64"}], "name": "LogMake", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "id", "type": "bytes32"}, {"indexed": true, "name": "pair", "type": "bytes32"}, {"indexed": true, "name": "maker", "type": "address"}, {"indexed": false, "name": "pay_gem", "type": "address"}, {"indexed": false, "name": "buy_gem", "type": "address"}, {"indexed": false, "name": "pay_amt", "type": "uint128"}, {"indexed": false, "name": "buy_amt", "type": "uint128"}, {"indexed": false, "name": "timestamp", "type": "uint64"}], "name": "LogBump", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "id", "type": "bytes32"}, {"indexed": true, "name": "pair", "type": "bytes32"}, {"indexed": true, "name": "maker", "type": "address"}, {"indexed": false, "name": "pay_gem", "type": "address"}, {"indexed": false, "name": "buy_gem", "type": "address"}, {"indexed": true, "name": "taker", "type": "address"}, {"indexed": false, "name": "take_amt", "type": "uint128"}, {"indexed": false, "name": "give_amt", "type": "uint128"}, {"indexed": false, "name": "timestamp", "type": "uint64"}], "name": "LogTake", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "id", "type": "bytes32"}, {"indexed": true, "name": "pair", "type": "bytes32"}, {"indexed": true, "name": "maker", "type": "address"}, {"indexed": false, "name": "pay_gem", "type": "address"}, {"indexed": false, "name": "buy_gem", "type": "address"}, {"indexed": false, "name": "pay_amt", "type": "uint128"}, {"indexed": false, "name": "buy_amt", "type": "uint128"}, {"indexed": false, "name": "timestamp", "type": "uint64"}], "name": "LogKill", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "authority", "type": "address"}], "name": "LogSetAuthority", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "owner", "type": "address"}], "name": "LogSetOwner", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "isEnabled", "type": "bool"}], "name": "LogBuyEnabled", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "pay_gem", "type": "address"}, {"indexed": false, "name": "min_amount", "type": "uint256"}], "name": "LogMinSell", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "isEnabled", "type": "bool"}], "name": "LogMatchingEnabled", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "id", "type": "uint256"}], "name": "LogUnsortedOffer", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "id", "type": "uint256"}], "name": "LogSortedOffer", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "baseToken", "type": "address"}, {"indexed": false, "name": "quoteToken", "type": "address"}], "name": "LogAddTokenPairWhitelist", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "baseToken", "type": "address"}, {"indexed": false, "name": "quoteToken", "type": "address"}], "name": "LogRemTokenPairWhitelist", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "keeper", "type": "address"}, {"indexed": false, "name": "id", "type": "uint256"}], "name": "LogInsert", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "keeper", "type": "address"}, {"indexed": false, "name": "id", "type": "uint256"}], "name": "LogDelete", "type": "event"}]
const momAbi = [{"constant": false, "inputs": [{"name": "owner_", "type": "address"}], "name": "setOwner", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "wad", "type": "uint256"}], "name": "setTubGap", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "wad", "type": "uint256"}], "name": "setTapGap", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "ray", "type": "uint256"}], "name": "setTax", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "tub", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "wad", "type": "uint256"}], "name": "setCap", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "vox", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "ray", "type": "uint256"}], "name": "setFee", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "authority_", "type": "address"}], "name": "setAuthority", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "ray", "type": "uint256"}], "name": "setMat", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "pip_", "type": "address"}], "name": "setPip", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "owner", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "ray", "type": "uint256"}], "name": "setHow", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "ray", "type": "uint256"}], "name": "setAxe", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "ray", "type": "uint256"}], "name": "setWay", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "authority", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "vox_", "type": "address"}], "name": "setVox", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "pep_", "type": "address"}], "name": "setPep", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "tap", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"inputs": [{"name": "tub_", "type": "address"}, {"name": "tap_", "type": "address"}, {"name": "vox_", "type": "address"}], "payable": false, "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": true, "inputs": [{"indexed": true, "name": "sig", "type": "bytes4"}, {"indexed": true, "name": "guy", "type": "address"}, {"indexed": true, "name": "foo", "type": "bytes32"}, {"indexed": true, "name": "bar", "type": "bytes32"}, {"indexed": false, "name": "wad", "type": "uint256"}, {"indexed": false, "name": "fax", "type": "bytes"}], "name": "LogNote", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "authority", "type": "address"}], "name": "LogSetAuthority", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "owner", "type": "address"}], "name": "LogSetOwner", "type": "event"}];
const makerAbi = [{"constant": false, "inputs": [{"name": "wad", "type": "uint256"}], "name": "join", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "sin", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "skr", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "gov", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "owner_", "type": "address"}], "name": "setOwner", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "era", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "cup", "type": "bytes32"}], "name": "ink", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "rho", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "air", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [], "name": "rhi", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [], "name": "flow", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "cap", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}], "name": "bite", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}, {"name": "wad", "type": "uint256"}], "name": "draw", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [{"name": "wad", "type": "uint256"}], "name": "bid", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "cupi", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "axe", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "tag", "outputs": [{"name": "wad", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "off", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "vox", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "gap", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}], "name": "rap", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}, {"name": "wad", "type": "uint256"}], "name": "wipe", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "authority_", "type": "address"}], "name": "setAuthority", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "gem", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "tap_", "type": "address"}], "name": "turn", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "per", "outputs": [{"name": "ray", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "wad", "type": "uint256"}], "name": "exit", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "pip_", "type": "address"}], "name": "setPip", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "pie", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "fit_", "type": "uint256"}, {"name": "jam", "type": "uint256"}], "name": "cage", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "rum", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "owner", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "sai", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "param", "type": "bytes32"}, {"name": "val", "type": "uint256"}], "name": "mold", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "tax", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [], "name": "drip", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}, {"name": "wad", "type": "uint256"}], "name": "free", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "mat", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "pep", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "out", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}, {"name": "wad", "type": "uint256"}], "name": "lock", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}], "name": "shut", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}, {"name": "guy", "type": "address"}], "name": "give", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "authority", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [], "name": "fit", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [], "name": "chi", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [{"name": "vox_", "type": "address"}], "name": "setVox", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "pip", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "pep_", "type": "address"}], "name": "setPep", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "fee", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "cup", "type": "bytes32"}], "name": "lad", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [], "name": "din", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [{"name": "wad", "type": "uint256"}], "name": "ask", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}], "name": "safe", "outputs": [{"name": "", "type": "bool"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "pit", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": false, "inputs": [{"name": "cup", "type": "bytes32"}], "name": "tab", "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": false, "inputs": [], "name": "open", "outputs": [{"name": "cup", "type": "bytes32"}], "payable": false, "stateMutability": "nonpayable", "type": "function"}, {"constant": true, "inputs": [], "name": "tap", "outputs": [{"name": "", "type": "address"}], "payable": false, "stateMutability": "view", "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "bytes32"}], "name": "cups", "outputs": [{"name": "lad", "type": "address"}, {"name": "ink", "type": "uint256"}, {"name": "art", "type": "uint256"}, {"name": "ire", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}, {"inputs": [{"name": "sai_", "type": "address"}, {"name": "sin_", "type": "address"}, {"name": "skr_", "type": "address"}, {"name": "gem_", "type": "address"}, {"name": "gov_", "type": "address"}, {"name": "pip_", "type": "address"}, {"name": "pep_", "type": "address"}, {"name": "vox_", "type": "address"}, {"name": "pit_", "type": "address"}], "payable": false, "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "lad", "type": "address"}, {"indexed": false, "name": "cup", "type": "bytes32"}], "name": "LogNewCup", "type": "event"}, {"anonymous": true, "inputs": [{"indexed": true, "name": "sig", "type": "bytes4"}, {"indexed": true, "name": "guy", "type": "address"}, {"indexed": true, "name": "foo", "type": "bytes32"}, {"indexed": true, "name": "bar", "type": "bytes32"}, {"indexed": false, "name": "wad", "type": "uint256"}, {"indexed": false, "name": "fax", "type": "bytes"}], "name": "LogNote", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "authority", "type": "address"}], "name": "LogSetAuthority", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "owner", "type": "address"}], "name": "LogSetOwner", "type": "event"}]

type EthersOptions = {
  gasPrice?: utils.BigNumber;
  value?: utils.BigNumber;
}

const TRANSACTION_TIMEOUT = 120000;

class CallableContract {
	private readonly gasPrice: utils.BigNumber;
	private readonly contract: Contract;

	public constructor(contract: Contract, gasPriceInNanoeth: number) {
		this.contract = contract;
		this.gasPrice = new utils.BigNumber(gasPriceInNanoeth * 10 ** 9);
	}

	protected async localCall(parameters: Array<any>, txName: string, sender?: string, attachedEth?: BN): Promise<Array<any>> {
		var overrideOptions: EthersOptions = {};
		if (attachedEth !== undefined) overrideOptions["value"] = new utils.BigNumber(attachedEth);
		return [await this.contract.functions[txName.toString()](...parameters, overrideOptions)];
	}

	protected async remoteCall(parameters: Array<any>, txName: string, sender?: string, gasPrice?: BN, attachedEth?: BN): Promise<string|undefined> {
		var overrideOptions: EthersOptions = {};
		if (this.gasPrice !== undefined) overrideOptions["gasPrice"] = this.gasPrice;
		if (gasPrice !== undefined) overrideOptions["gasPrice"] = new utils.BigNumber(gasPrice);
		if (attachedEth !== undefined) overrideOptions["value"] = new utils.BigNumber(attachedEth);
		const txDetails = await this.contract.functions[txName](...parameters, overrideOptions);
		const hash = txDetails.hash;
		await this.contract.provider.waitForTransaction(hash, TRANSACTION_TIMEOUT);
		const txReceipt = await this.contract.provider.getTransactionReceipt(hash);
		if (txReceipt.blockNumber >= 0) {
			return hash;
		} else {
			throw new Error(`Transaction ${hash} submitted, but not mined within ${TRANSACTION_TIMEOUT}ms`);
		}
	}
}

export class OasisdexContract extends CallableContract {

  public constructor(oasisAddress: string, wallet: Wallet, gasPriceInNanoeth: number) {
    super(new Contract(oasisAddress, oasisAbi, wallet), gasPriceInNanoeth);
  }

  public getBestOffer_ = async (sell_gem: string, buy_gem: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([sell_gem, buy_gem], "getBestOffer", options.sender);
    return <BN>result[0];
  }

  public sellAllAmount = async (pay_gem: string, pay_amt: BN, buy_gem: string, min_fill_amount: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([pay_gem, pay_amt, buy_gem, min_fill_amount], "sellAllAmount", options.sender, options.gasPrice);
    return;
  }

  public stop = async (options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([], "stop", options.sender, options.gasPrice);
    return;
  }

  public make = async (pay_gem: string, buy_gem: string, pay_amt: BN, buy_amt: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([pay_gem, buy_gem, pay_amt, buy_amt], "make", options.sender, options.gasPrice);
    return;
  }

  public setOwner = async (owner_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([owner_], "setOwner", options.sender, options.gasPrice);
    return;
  }

  public getBuyAmount_ = async (buy_gem: string, pay_gem: string, pay_amt: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([buy_gem, pay_gem, pay_amt], "getBuyAmount", options.sender);
    return <BN>result[0];
  }

  public addTokenPairWhitelist = async (baseToken: string, quoteToken: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([baseToken, quoteToken], "addTokenPairWhitelist", options.sender, options.gasPrice);
    return;
  }

  public remTokenPairWhitelist = async (baseToken: string, quoteToken: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([baseToken, quoteToken], "remTokenPairWhitelist", options.sender, options.gasPrice);
    return;
  }

  public offer = async (pay_amt: BN, pay_gem: string, buy_amt: BN, buy_gem: string, pos: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([pay_amt, pay_gem, buy_amt, buy_gem, pos], "offer", options.sender, options.gasPrice);
    return;
  }

  public insert = async (id: BN, pos: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id, pos], "insert", options.sender, options.gasPrice);
    return;
  }

  public last_offer_id_ = async (options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([], "last_offer_id", options.sender);
    return <BN>result[0];
  }

  public setMatchingEnabled = async (matchingEnabled_: boolean, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([matchingEnabled_], "setMatchingEnabled", options.sender, options.gasPrice);
    return;
  }

  public cancel = async (id: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id], "cancel", options.sender, options.gasPrice);
    return;
  }

  public getOffer_ = async (id: BN, options?: { sender?: string }): Promise<Array<string>> => {
    options = options || {};
    const result = await this.localCall([id], "getOffer", options.sender);
    return <Array<string>>result;
  }

  public del_rank = async (id: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id], "del_rank", options.sender, options.gasPrice);
    return;
  }

  public take = async (id: string, maxTakeAmount: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id, maxTakeAmount], "take", options.sender, options.gasPrice);
    return;
  }

  public getMinSell_ = async (pay_gem: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([pay_gem], "getMinSell", options.sender);
    return <BN>result[0];
  }

  public getTime_ = async (options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([], "getTime", options.sender);
    return <BN>result[0];
  }

  public getNextUnsortedOffer_ = async (id: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([id], "getNextUnsortedOffer", options.sender);
    return <BN>result[0];
  }

  public close_time_ = async (options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([], "close_time", options.sender);
    return <BN>result[0];
  }

  public _span_ = async (arg0: string, arg1: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([arg0, arg1], "span", options.sender);
    return <BN>result[0];
  }

  public _best_ = async (arg0: string, arg1: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([arg0, arg1], "best", options.sender);
    return <BN>result[0];
  }

  public stopped_ = async (options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([], "stopped", options.sender);
    return <boolean>result[0];
  }

  public bump = async (id_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id_], "bump", options.sender, options.gasPrice);
    return;
  }

  public setAuthority = async (authority_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([authority_], "setAuthority", options.sender, options.gasPrice);
    return;
  }

  public getOfferCount_ = async (sell_gem: string, buy_gem: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([sell_gem, buy_gem], "getOfferCount", options.sender);
    return <BN>result[0];
  }

  public buyAllAmount = async (buy_gem: string, buy_amt: BN, pay_gem: string, max_fill_amount: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([buy_gem, buy_amt, pay_gem, max_fill_amount], "buyAllAmount", options.sender, options.gasPrice);
    return;
  }

  public isActive_ = async (id: BN, options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([id], "isActive", options.sender);
    return <boolean>result[0];
  }

  public offers_ = async (arg0: BN, options?: { sender?: string }): Promise<Array<string>> => {
    options = options || {};
    const result = await this.localCall([arg0], "offers", options.sender);
    return <Array<string>>result;
  }

  public getFirstUnsortedOffer_ = async (options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([], "getFirstUnsortedOffer", options.sender);
    return <BN>result[0];
  }

  public isTokenPairWhitelisted_ = async (baseToken: string, quoteToken: string, options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([baseToken, quoteToken], "isTokenPairWhitelisted", options.sender);
    return <boolean>result[0];
  }

  public owner_ = async (options?: { sender?: string }): Promise<string> => {
    options = options || {};
    const result = await this.localCall([], "owner", options.sender);
    return <string>result[0];
  }

  public getBetterOffer_ = async (id: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([id], "getBetterOffer", options.sender);
    return <BN>result[0];
  }

  public _dust_ = async (arg0: string, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([arg0], "_dust", options.sender);
    return <BN>result[0];
  }

  public getWorseOffer_ = async (id: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([id], "getWorseOffer", options.sender);
    return <BN>result[0];
  }

  public _menu_ = async (arg0: string, options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([arg0], "_menu", options.sender);
    return <boolean>result[0];
  }

  public _near_ = async (arg0: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([arg0], "_near", options.sender);
    return <BN>result[0];
  }

  public kill = async (id: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id], "kill", options.sender, options.gasPrice);
    return;
  }

  public kill_ = async (id: string, options?: { sender?: string }): Promise<void> => {
    options = options || {};
    await this.localCall([id], "kill", options.sender);

  }

  public setMinSell = async (pay_gem: string, dust: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([pay_gem, dust], "setMinSell", options.sender, options.gasPrice);
    return;
  }

  public authority_ = async (options?: { sender?: string }): Promise<string> => {
    options = options || {};
    const result = await this.localCall([], "authority", options.sender);
    return <string>result[0];
  }

  public isClosed_ = async (options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([], "isClosed", options.sender);
    return <boolean>result[0];
  }

  public _rank_ = async (arg0: BN, options?: { sender?: string }): Promise<Array<string>> => {
    options = options || {};
    const result = await this.localCall([arg0], "_rank", options.sender);
    return <Array<string>>result;
  }

  public getOwner_ = async (id: BN, options?: { sender?: string }): Promise<string> => {
    options = options || {};
    const result = await this.localCall([id], "getOwner", options.sender);
    return <string>result[0];
  }

  public isOfferSorted_ = async (id: BN, options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([id], "isOfferSorted", options.sender);
    return <boolean>result[0];
  }

  public setBuyEnabled = async (buyEnabled_: boolean, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([buyEnabled_], "setBuyEnabled", options.sender, options.gasPrice);
    return;
  }

  public buy = async (id: BN, amount: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
    options = options || {};
    await this.remoteCall([id, amount], "buy", options.sender, options.gasPrice);
    return;
  }

  public buyEnabled_ = async (options?: { sender?: string }): Promise<boolean> => {
    options = options || {};
    const result = await this.localCall([], "buyEnabled", options.sender);
    return <boolean>result[0];
  }

  public getPayAmount_ = async (pay_gem: string, buy_gem: string, buy_amt: BN, options?: { sender?: string }): Promise<BN> => {
    options = options || {};
    const result = await this.localCall([pay_gem, buy_gem, buy_amt], "getPayAmount", options.sender);
    return <BN>result[0];
  }
}

export class SaiMom extends CallableContract {
	public constructor(momAddress: string, wallet: Wallet, gasPriceInNanoeth: number) {
		super(new Contract(momAddress, momAbi, wallet), gasPriceInNanoeth);
	}

	public setOwner = async(owner_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([owner_], "setOwner", options.sender, options.gasPrice);
		return;
	}

	public setOwner_ = async(owner_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([owner_], "setOwner", options.sender);

	}

	public setTubGap = async(wad: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([wad], "setTubGap", options.sender, options.gasPrice);
		return;
	}

	public setTubGap_ = async(wad: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([wad], "setTubGap", options.sender);

	}

	public setTapGap = async(wad: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([wad], "setTapGap", options.sender, options.gasPrice);
		return;
	}

	public setTapGap_ = async(wad: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([wad], "setTapGap", options.sender);

	}

	public setTax = async(ray: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([ray], "setTax", options.sender, options.gasPrice);
		return;
	}

	public setTax_ = async(ray: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([ray], "setTax", options.sender);

	}

	public tub_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "tub", options.sender);
		return <string>result[0];
	}

	public setCap = async(wad: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([wad], "setCap", options.sender, options.gasPrice);
		return;
	}

	public setCap_ = async(wad: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([wad], "setCap", options.sender);

	}

	public vox_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "vox", options.sender);
		return <string>result[0];
	}

	public setFee = async(ray: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([ray], "setFee", options.sender, options.gasPrice);
		return;
	}

	public setFee_ = async(ray: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([ray], "setFee", options.sender);

	}

	public setAuthority = async(authority_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([authority_], "setAuthority", options.sender, options.gasPrice);
		return;
	}

	public setAuthority_ = async(authority_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([authority_], "setAuthority", options.sender);

	}

	public setMat = async(ray: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([ray], "setMat", options.sender, options.gasPrice);
		return;
	}

	public setMat_ = async(ray: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([ray], "setMat", options.sender);

	}

	public setPip = async(pip_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([pip_], "setPip", options.sender, options.gasPrice);
		return;
	}

	public setPip_ = async(pip_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([pip_], "setPip", options.sender);

	}

	public owner_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "owner", options.sender);
		return <string>result[0];
	}

	public setHow = async(ray: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([ray], "setHow", options.sender, options.gasPrice);
		return;
	}

	public setHow_ = async(ray: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([ray], "setHow", options.sender);

	}

	public setAxe = async(ray: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([ray], "setAxe", options.sender, options.gasPrice);
		return;
	}

	public setAxe_ = async(ray: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([ray], "setAxe", options.sender);

	}

	public setWay = async(ray: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([ray], "setWay", options.sender, options.gasPrice);
		return;
	}

	public setWay_ = async(ray: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([ray], "setWay", options.sender);

	}

	public authority_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "authority", options.sender);
		return <string>result[0];
	}

	public setVox = async(vox_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([vox_], "setVox", options.sender, options.gasPrice);
		return;
	}

	public setVox_ = async(vox_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([vox_], "setVox", options.sender);

	}

	public setPep = async(pep_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([pep_], "setPep", options.sender, options.gasPrice);
		return;
	}

	public setPep_ = async(pep_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([pep_], "setPep", options.sender);

	}

	public tap_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "tap", options.sender);
		return <string>result[0];
	}
}

export class SaiTub extends CallableContract {
	public constructor(makerAddress: string, wallet: Wallet, gasPriceInNanoeth: number) {
		super(new Contract(makerAddress, makerAbi, wallet), gasPriceInNanoeth);
	}

	public join = async(wad: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([wad], "join", options.sender, options.gasPrice);
		return;
	}

	public join_ = async(wad: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([wad], "join", options.sender);

	}

	public sin_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "sin", options.sender);
		return <string>result[0];
	}

	public skr_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "skr", options.sender);
		return <string>result[0];
	}

	public gov_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "gov", options.sender);
		return <string>result[0];
	}

	public setOwner = async(owner_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([owner_], "setOwner", options.sender, options.gasPrice);
		return;
	}

	public setOwner_ = async(owner_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([owner_], "setOwner", options.sender);

	}

	public era_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "era", options.sender);
		return <BN>result[0];
	}

	public ink_ = async(cup: string, options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([cup], "ink", options.sender);
		return <BN>result[0];
	}

	public rho_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "rho", options.sender);
		return <BN>result[0];
	}

	public air_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "air", options.sender);
		return <BN>result[0];
	}

	public rhi = async( options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([], "rhi", options.sender, options.gasPrice);
		return;
	}

	public rhi_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "rhi", options.sender);
		return <BN>result[0];
	}

	public flow = async( options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([], "flow", options.sender, options.gasPrice);
		return;
	}

	public flow_ = async( options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([], "flow", options.sender);

	}

	public cap_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "cap", options.sender);
		return <BN>result[0];
	}

	public bite = async(cup: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup], "bite", options.sender, options.gasPrice);
		return;
	}

	public bite_ = async(cup: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([cup], "bite", options.sender);

	}

	public draw = async(cup: string, wad: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup, wad], "draw", options.sender, options.gasPrice);
		return;
	}

	public draw_ = async(cup: string, wad: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([cup, wad], "draw", options.sender);

	}

	public bid_ = async(wad: BN, options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([wad], "bid", options.sender);
		return <BN>result[0];
	}

	public cupi_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "cupi", options.sender);
		return <BN>result[0];
	}

	public axe_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "axe", options.sender);
		return <BN>result[0];
	}

	public tag_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "tag", options.sender);
		return <BN>result[0];
	}

	public off_ = async( options?: { sender?: string }): Promise<boolean> => {
		options = options || {};
		const result = await this.localCall([], "off", options.sender);
		return <boolean>result[0];
	}

	public vox_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "vox", options.sender);
		return <string>result[0];
	}

	public gap_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "gap", options.sender);
		return <BN>result[0];
	}

	public rap = async(cup: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup], "rap", options.sender, options.gasPrice);
		return;
	}

	public rap_ = async(cup: string, options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([cup], "rap", options.sender);
		return <BN>result[0];
	}

	public wipe = async(cup: string, wad: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup, wad], "wipe", options.sender, options.gasPrice);
		return;
	}

	public wipe_ = async(cup: string, wad: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([cup, wad], "wipe", options.sender);

	}

	public setAuthority = async(authority_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([authority_], "setAuthority", options.sender, options.gasPrice);
		return;
	}

	public setAuthority_ = async(authority_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([authority_], "setAuthority", options.sender);

	}

	public gem_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "gem", options.sender);
		return <string>result[0];
	}

	public turn = async(tap_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([tap_], "turn", options.sender, options.gasPrice);
		return;
	}

	public turn_ = async(tap_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([tap_], "turn", options.sender);

	}

	public per_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "per", options.sender);
		return <BN>result[0];
	}

	public exit = async(wad: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([wad], "exit", options.sender, options.gasPrice);
		return;
	}

	public exit_ = async(wad: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([wad], "exit", options.sender);

	}

	public setPip = async(pip_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([pip_], "setPip", options.sender, options.gasPrice);
		return;
	}

	public setPip_ = async(pip_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([pip_], "setPip", options.sender);

	}

	public pie_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "pie", options.sender);
		return <BN>result[0];
	}

	public cage = async(fit_: BN, jam: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([fit_, jam], "cage", options.sender, options.gasPrice);
		return;
	}

	public cage_ = async(fit_: BN, jam: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([fit_, jam], "cage", options.sender);

	}

	public rum_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "rum", options.sender);
		return <BN>result[0];
	}

	public owner_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "owner", options.sender);
		return <string>result[0];
	}

	public sai_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "sai", options.sender);
		return <string>result[0];
	}

	public mold = async(param: string, val: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([param, val], "mold", options.sender, options.gasPrice);
		return;
	}

	public mold_ = async(param: string, val: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([param, val], "mold", options.sender);

	}

	public tax_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "tax", options.sender);
		return <BN>result[0];
	}

	public drip = async( options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([], "drip", options.sender, options.gasPrice);
		return;
	}

	public drip_ = async( options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([], "drip", options.sender);

	}

	public free = async(cup: string, wad: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup, wad], "free", options.sender, options.gasPrice);
		return;
	}

	public free_ = async(cup: string, wad: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([cup, wad], "free", options.sender);

	}

	public mat_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "mat", options.sender);
		return <BN>result[0];
	}

	public pep_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "pep", options.sender);
		return <string>result[0];
	}

	public out_ = async( options?: { sender?: string }): Promise<boolean> => {
		options = options || {};
		const result = await this.localCall([], "out", options.sender);
		return <boolean>result[0];
	}

	public lock = async(cup: string, wad: BN, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup, wad], "lock", options.sender, options.gasPrice);
		return;
	}

	public lock_ = async(cup: string, wad: BN, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([cup, wad], "lock", options.sender);

	}

	public shut = async(cup: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup], "shut", options.sender, options.gasPrice);
		return;
	}

	public shut_ = async(cup: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([cup], "shut", options.sender);

	}

	public give = async(cup: string, guy: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup, guy], "give", options.sender, options.gasPrice);
		return;
	}

	public give_ = async(cup: string, guy: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([cup, guy], "give", options.sender);

	}

	public authority_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "authority", options.sender);
		return <string>result[0];
	}

	public fit_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "fit", options.sender);
		return <BN>result[0];
	}

	public chi = async( options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([], "chi", options.sender, options.gasPrice);
		return;
	}

	public chi_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "chi", options.sender);
		return <BN>result[0];
	}

	public setVox = async(vox_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([vox_], "setVox", options.sender, options.gasPrice);
		return;
	}

	public setVox_ = async(vox_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([vox_], "setVox", options.sender);

	}

	public pip_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "pip", options.sender);
		return <string>result[0];
	}

	public setPep = async(pep_: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([pep_], "setPep", options.sender, options.gasPrice);
		return;
	}

	public setPep_ = async(pep_: string, options?: { sender?: string }): Promise<void> => {
		options = options || {};
		await this.localCall([pep_], "setPep", options.sender);

	}

	public fee_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "fee", options.sender);
		return <BN>result[0];
	}

	public lad_ = async(cup: string, options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([cup], "lad", options.sender);
		return <string>result[0];
	}

	public din = async( options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([], "din", options.sender, options.gasPrice);
		return;
	}

	public din_ = async( options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([], "din", options.sender);
		return <BN>result[0];
	}

	public ask_ = async(wad: BN, options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([wad], "ask", options.sender);
		return <BN>result[0];
	}

	public safe = async(cup: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup], "safe", options.sender, options.gasPrice);
		return;
	}

	public safe_ = async(cup: string, options?: { sender?: string }): Promise<boolean> => {
		options = options || {};
		const result = await this.localCall([cup], "safe", options.sender);
		return <boolean>result[0];
	}

	public pit_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "pit", options.sender);
		return <string>result[0];
	}

	public tab = async(cup: string, options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([cup], "tab", options.sender, options.gasPrice);
		return;
	}

	public tab_ = async(cup: string, options?: { sender?: string }): Promise<BN> => {
		options = options || {};
		const result = await this.localCall([cup], "tab", options.sender);
		return <BN>result[0];
	}

	public open = async( options?: { sender?: string, gasPrice?: BN }): Promise<void> => {
		options = options || {};
		await this.remoteCall([], "open", options.sender, options.gasPrice);
		return;
	}

	public open_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "open", options.sender);
		return <string>result[0];
	}

	public tap_ = async( options?: { sender?: string }): Promise<string> => {
		options = options || {};
		const result = await this.localCall([], "tap", options.sender);
		return <string>result[0];
	}

	public cups_ = async(arg0: string, options?: { sender?: string }): Promise<Array<string>> => {
		options = options || {};
		const result = await this.localCall([arg0], "cups", options.sender);
		return <Array<string>>result;
	}
}
