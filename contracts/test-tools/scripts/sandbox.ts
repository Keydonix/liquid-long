import { Wallet, providers, Contract, utils } from 'ethers'

const liquidLongAbi = [
	{
		"constant": false,
		"inputs": [
			{
				"name": "_user",
				"type": "address"
			},
			{
				"name": "_offset",
				"type": "uint256"
			},
			{
				"name": "_pageSize",
				"type": "uint256"
			}
		],
		"name": "getCdps",
		"outputs": [
			{
				"components": [
					{
						"name": "id",
						"type": "uint256"
					},
					{
						"name": "debtInAttodai",
						"type": "uint256"
					},
					{
						"name": "lockedAttoeth",
						"type": "uint256"
					},
					{
						"name": "feeInAttoeth",
						"type": "uint256"
					},
					{
						"name": "liquidationCostInAttoeth",
						"type": "uint256"
					},
					{
						"name": "liquidatableDebtInAttodai",
						"type": "uint256"
					},
					{
						"name": "liquidationCostAtFeedPriceInAttoeth",
						"type": "uint256"
					},
					{
						"name": "userOwned",
						"type": "bool"
					}
				],
				"name": "_cdps",
				"type": "tuple[]"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_payGem",
				"type": "address"
			},
			{
				"name": "_buyGem",
				"type": "address"
			},
			{
				"name": "_payDesiredAmount",
				"type": "uint256"
			}
		],
		"name": "getPayPriceAndAmount",
		"outputs": [
			{
				"name": "_paidAmount",
				"type": "uint256"
			},
			{
				"name": "_boughtAmount",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "unpause",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_attodaiToBuy",
				"type": "uint256"
			}
		],
		"name": "estimateDaiPurchaseCosts",
		"outputs": [
			{
				"name": "_wethPaid",
				"type": "uint256"
			},
			{
				"name": "_daiBought",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_payGem",
				"type": "address"
			},
			{
				"name": "_buyGem",
				"type": "address"
			},
			{
				"name": "_payAmount",
				"type": "uint256"
			},
			{
				"name": "_buyAmount",
				"type": "uint256"
			}
		],
		"name": "getVolumeAtPrice",
		"outputs": [
			{
				"name": "_paidAmount",
				"type": "uint256"
			},
			{
				"name": "_boughtAmount",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "claimOwnership",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "maker",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_attodaiToSell",
				"type": "uint256"
			}
		],
		"name": "estimateDaiSaleProceeds",
		"outputs": [
			{
				"name": "_daiPaid",
				"type": "uint256"
			},
			{
				"name": "_wethBought",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "paused",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "ethPriceInUsd",
		"outputs": [
			{
				"name": "_attousd",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_payGem",
				"type": "address"
			},
			{
				"name": "_buyGem",
				"type": "address"
			},
			{
				"name": "_buyDesiredAmount",
				"type": "uint256"
			}
		],
		"name": "getBuyPriceAndAmount",
		"outputs": [
			{
				"name": "_paidAmount",
				"type": "uint256"
			},
			{
				"name": "_boughtAmount",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "pause",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "oasis",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "pendingOwner",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "cdpCount",
		"outputs": [
			{
				"name": "_cdpCount",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "_oasis",
				"type": "address"
			},
			{
				"name": "_maker",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "Pause",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "Unpause",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "previousOwner",
				"type": "address"
			}
		],
		"name": "OwnershipRenounced",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	}
]

const makerAbi = [
	{
		"constant": false,
		"inputs": [
			{
				"name": "wad",
				"type": "uint256"
			}
		],
		"name": "join",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "sin",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "skr",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "gov",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "owner_",
				"type": "address"
			}
		],
		"name": "setOwner",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "era",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			}
		],
		"name": "ink",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "rho",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "air",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "rhi",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "flow",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "cap",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			}
		],
		"name": "bite",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			},
			{
				"name": "wad",
				"type": "uint256"
			}
		],
		"name": "draw",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "wad",
				"type": "uint256"
			}
		],
		"name": "bid",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "cupi",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "axe",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "tag",
		"outputs": [
			{
				"name": "wad",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "off",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "vox",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "gap",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			}
		],
		"name": "rap",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			},
			{
				"name": "wad",
				"type": "uint256"
			}
		],
		"name": "wipe",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "authority_",
				"type": "address"
			}
		],
		"name": "setAuthority",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "gem",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "tap_",
				"type": "address"
			}
		],
		"name": "turn",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "per",
		"outputs": [
			{
				"name": "ray",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "wad",
				"type": "uint256"
			}
		],
		"name": "exit",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "pip_",
				"type": "address"
			}
		],
		"name": "setPip",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "pie",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "fit_",
				"type": "uint256"
			},
			{
				"name": "jam",
				"type": "uint256"
			}
		],
		"name": "cage",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "rum",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "sai",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "param",
				"type": "bytes32"
			},
			{
				"name": "val",
				"type": "uint256"
			}
		],
		"name": "mold",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "tax",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "drip",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			},
			{
				"name": "wad",
				"type": "uint256"
			}
		],
		"name": "free",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "mat",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "pep",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "out",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			},
			{
				"name": "wad",
				"type": "uint256"
			}
		],
		"name": "lock",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			}
		],
		"name": "shut",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			},
			{
				"name": "guy",
				"type": "address"
			}
		],
		"name": "give",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "authority",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "fit",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "chi",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "vox_",
				"type": "address"
			}
		],
		"name": "setVox",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "pip",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "pep_",
				"type": "address"
			}
		],
		"name": "setPep",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "fee",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			}
		],
		"name": "lad",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "din",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "wad",
				"type": "uint256"
			}
		],
		"name": "ask",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			}
		],
		"name": "safe",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "pit",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "cup",
				"type": "bytes32"
			}
		],
		"name": "tab",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "open",
		"outputs": [
			{
				"name": "cup",
				"type": "bytes32"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "tap",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "cups",
		"outputs": [
			{
				"name": "lad",
				"type": "address"
			},
			{
				"name": "ink",
				"type": "uint256"
			},
			{
				"name": "art",
				"type": "uint256"
			},
			{
				"name": "ire",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "sai_",
				"type": "address"
			},
			{
				"name": "sin_",
				"type": "address"
			},
			{
				"name": "skr_",
				"type": "address"
			},
			{
				"name": "gem_",
				"type": "address"
			},
			{
				"name": "gov_",
				"type": "address"
			},
			{
				"name": "pip_",
				"type": "address"
			},
			{
				"name": "pep_",
				"type": "address"
			},
			{
				"name": "vox_",
				"type": "address"
			},
			{
				"name": "pit_",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "lad",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "cup",
				"type": "bytes32"
			}
		],
		"name": "LogNewCup",
		"type": "event"
	},
	{
		"anonymous": true,
		"inputs": [
			{
				"indexed": true,
				"name": "sig",
				"type": "bytes4"
			},
			{
				"indexed": true,
				"name": "guy",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "foo",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "bar",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"name": "wad",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "fax",
				"type": "bytes"
			}
		],
		"name": "LogNote",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "authority",
				"type": "address"
			}
		],
		"name": "LogSetAuthority",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "owner",
				"type": "address"
			}
		],
		"name": "LogSetOwner",
		"type": "event"
	}
]

const oasisAbi = [
	{
		"constant": true,
		"inputs": [],
		"name": "matchingEnabled",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "sell_gem",
				"type": "address"
			},
			{
				"name": "buy_gem",
				"type": "address"
			}
		],
		"name": "getBestOffer",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "pay_amt",
				"type": "uint256"
			},
			{
				"name": "buy_gem",
				"type": "address"
			},
			{
				"name": "min_fill_amount",
				"type": "uint256"
			}
		],
		"name": "sellAllAmount",
		"outputs": [
			{
				"name": "fill_amt",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "stop",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "buy_gem",
				"type": "address"
			},
			{
				"name": "pay_amt",
				"type": "uint128"
			},
			{
				"name": "buy_amt",
				"type": "uint128"
			}
		],
		"name": "make",
		"outputs": [
			{
				"name": "",
				"type": "bytes32"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "owner_",
				"type": "address"
			}
		],
		"name": "setOwner",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "buy_gem",
				"type": "address"
			},
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "pay_amt",
				"type": "uint256"
			}
		],
		"name": "getBuyAmount",
		"outputs": [
			{
				"name": "fill_amt",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "baseToken",
				"type": "address"
			},
			{
				"name": "quoteToken",
				"type": "address"
			}
		],
		"name": "addTokenPairWhitelist",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "baseToken",
				"type": "address"
			},
			{
				"name": "quoteToken",
				"type": "address"
			}
		],
		"name": "remTokenPairWhitelist",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "pay_amt",
				"type": "uint256"
			},
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "buy_amt",
				"type": "uint256"
			},
			{
				"name": "buy_gem",
				"type": "address"
			},
			{
				"name": "pos",
				"type": "uint256"
			}
		],
		"name": "offer",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			},
			{
				"name": "pos",
				"type": "uint256"
			}
		],
		"name": "insert",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "last_offer_id",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "matchingEnabled_",
				"type": "bool"
			}
		],
		"name": "setMatchingEnabled",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "cancel",
		"outputs": [
			{
				"name": "success",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "getOffer",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "del_rank",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "id",
				"type": "bytes32"
			},
			{
				"name": "maxTakeAmount",
				"type": "uint128"
			}
		],
		"name": "take",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "pay_gem",
				"type": "address"
			}
		],
		"name": "getMinSell",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getTime",
		"outputs": [
			{
				"name": "",
				"type": "uint64"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "getNextUnsortedOffer",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "close_time",
		"outputs": [
			{
				"name": "",
				"type": "uint64"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "_span",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "_best",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "stopped",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "id_",
				"type": "bytes32"
			}
		],
		"name": "bump",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "authority_",
				"type": "address"
			}
		],
		"name": "setAuthority",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "sell_gem",
				"type": "address"
			},
			{
				"name": "buy_gem",
				"type": "address"
			}
		],
		"name": "getOfferCount",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "buy_gem",
				"type": "address"
			},
			{
				"name": "buy_amt",
				"type": "uint256"
			},
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "max_fill_amount",
				"type": "uint256"
			}
		],
		"name": "buyAllAmount",
		"outputs": [
			{
				"name": "fill_amt",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "isActive",
		"outputs": [
			{
				"name": "active",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "offers",
		"outputs": [
			{
				"name": "pay_amt",
				"type": "uint256"
			},
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "buy_amt",
				"type": "uint256"
			},
			{
				"name": "buy_gem",
				"type": "address"
			},
			{
				"name": "owner",
				"type": "address"
			},
			{
				"name": "timestamp",
				"type": "uint64"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getFirstUnsortedOffer",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "baseToken",
				"type": "address"
			},
			{
				"name": "quoteToken",
				"type": "address"
			}
		],
		"name": "isTokenPairWhitelisted",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "getBetterOffer",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "_dust",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "getWorseOffer",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "_menu",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "_near",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "id",
				"type": "bytes32"
			}
		],
		"name": "kill",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "dust",
				"type": "uint256"
			}
		],
		"name": "setMinSell",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "authority",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "isClosed",
		"outputs": [
			{
				"name": "closed",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "_rank",
		"outputs": [
			{
				"name": "next",
				"type": "uint256"
			},
			{
				"name": "prev",
				"type": "uint256"
			},
			{
				"name": "delb",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "getOwner",
		"outputs": [
			{
				"name": "owner",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "isOfferSorted",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "buyEnabled_",
				"type": "bool"
			}
		],
		"name": "setBuyEnabled",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "id",
				"type": "uint256"
			},
			{
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "buy",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "pay_amt",
				"type": "uint256"
			},
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "buy_amt",
				"type": "uint256"
			},
			{
				"name": "buy_gem",
				"type": "address"
			},
			{
				"name": "pos",
				"type": "uint256"
			},
			{
				"name": "rounding",
				"type": "bool"
			}
		],
		"name": "offer",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "pay_amt",
				"type": "uint256"
			},
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "buy_amt",
				"type": "uint256"
			},
			{
				"name": "buy_gem",
				"type": "address"
			}
		],
		"name": "offer",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "buyEnabled",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "pay_gem",
				"type": "address"
			},
			{
				"name": "buy_gem",
				"type": "address"
			},
			{
				"name": "buy_amt",
				"type": "uint256"
			}
		],
		"name": "getPayAmount",
		"outputs": [
			{
				"name": "fill_amt",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "close_time",
				"type": "uint64"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": true,
		"inputs": [
			{
				"indexed": true,
				"name": "sig",
				"type": "bytes4"
			},
			{
				"indexed": true,
				"name": "guy",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "foo",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "bar",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"name": "wad",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "fax",
				"type": "bytes"
			}
		],
		"name": "LogNote",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "LogItemUpdate",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "pay_amt",
				"type": "uint256"
			},
			{
				"indexed": true,
				"name": "pay_gem",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "buy_amt",
				"type": "uint256"
			},
			{
				"indexed": true,
				"name": "buy_gem",
				"type": "address"
			}
		],
		"name": "LogTrade",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "id",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "pair",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "maker",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "pay_gem",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "buy_gem",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "pay_amt",
				"type": "uint128"
			},
			{
				"indexed": false,
				"name": "buy_amt",
				"type": "uint128"
			},
			{
				"indexed": false,
				"name": "timestamp",
				"type": "uint64"
			}
		],
		"name": "LogMake",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "id",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "pair",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "maker",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "pay_gem",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "buy_gem",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "pay_amt",
				"type": "uint128"
			},
			{
				"indexed": false,
				"name": "buy_amt",
				"type": "uint128"
			},
			{
				"indexed": false,
				"name": "timestamp",
				"type": "uint64"
			}
		],
		"name": "LogBump",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "id",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "pair",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "maker",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "pay_gem",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "buy_gem",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "taker",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "take_amt",
				"type": "uint128"
			},
			{
				"indexed": false,
				"name": "give_amt",
				"type": "uint128"
			},
			{
				"indexed": false,
				"name": "timestamp",
				"type": "uint64"
			}
		],
		"name": "LogTake",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "id",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "pair",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"name": "maker",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "pay_gem",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "buy_gem",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "pay_amt",
				"type": "uint128"
			},
			{
				"indexed": false,
				"name": "buy_amt",
				"type": "uint128"
			},
			{
				"indexed": false,
				"name": "timestamp",
				"type": "uint64"
			}
		],
		"name": "LogKill",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "authority",
				"type": "address"
			}
		],
		"name": "LogSetAuthority",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "owner",
				"type": "address"
			}
		],
		"name": "LogSetOwner",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "isEnabled",
				"type": "bool"
			}
		],
		"name": "LogBuyEnabled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "pay_gem",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "min_amount",
				"type": "uint256"
			}
		],
		"name": "LogMinSell",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "isEnabled",
				"type": "bool"
			}
		],
		"name": "LogMatchingEnabled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "LogUnsortedOffer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "LogSortedOffer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "baseToken",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "quoteToken",
				"type": "address"
			}
		],
		"name": "LogAddTokenPairWhitelist",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "baseToken",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "quoteToken",
				"type": "address"
			}
		],
		"name": "LogRemTokenPairWhitelist",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "keeper",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "LogInsert",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "keeper",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "LogDelete",
		"type": "event"
	}
]

async function doStuff() {
	const provider = new providers.JsonRpcProvider('http://localhost:1235', { chainId: 4173, ensAddress: '', name: 'dev' })
	const wallet = new Wallet('0xfae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a', provider)
	const liquidLong = new Contract('0x80F8DAA435A9AB4B1802BA56FE7E0ABD0F8AB3D3', liquidLongAbi, wallet)
	const maker = new Contract('0x93943fb2d02ce1101dadc3ab1bc3cab723fd19d6', makerAbi, wallet)
	const oasis = new Contract('0x3c6721551c2ba3973560aef3e11d34ce05db4047', oasisAbi, wallet)

	// const result = await contract.functions.getCdps('0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Eb', 0, 100)
	const debtInDai = await maker.functions.tab('0x0000000000000000000000000000000000000000000000000000000000000001')
	console.log(`debtInDai: ${debtInDai.div('1000000000').toNumber() / 1000000000}`)
	let costToBuyDaiInEth = await liquidLong.functions.estimateDaiPurchaseCosts(debtInDai)
	console.log(`costToBuyDaiInEth: ${costToBuyDaiInEth.div('1000000000').toNumber() / 1000000000}`)
	const result = await liquidLong.functions.getCdps('0x913da4198e6be1d5f5e4a40d0667f70c0b5430eb', 0, 100)
	console.log(result)
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
