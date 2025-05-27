export const contractConfig = {
    wethAddress: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    uniAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    usdcAddress : '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    usdtAddress : '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    wbtcAddress : '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    factoryAddress : '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    managerAddress : '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    quoterAddress : '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
    USDT_USDC_address : '0x8261B98c0A98Fb426624E56270a8E25b660a9b94',
    WBTC_USDT_address : '0x71B18144925459cdE90800929C8f6eD97027f5a5',
    WETH_UNI_address : '0xC150e53FC05Fa6fEdA74C9B856b513B464213c7d',
    WETH_USDC_address : '0x76BF574a029d5298244C5310f1e289C7A956dF53',
    ABIS: {
        'ERC20': require('./abi/ERC20Mintable.sol/ERC20Mintable.json'),
        'Factory': require('./abi/UniswapV3Factory.sol/UniswapV3Factory.json'),
        'Manager': require('./abi/UniswapV3Manager.sol/UniswapV3Manager.json'),
        'Pool': require('./abi/UniswapV3Pool.sol/UniswapV3Pool.json'),
        'Quoter': require('./abi/UniswapV3Quoter.sol/UniswapV3Quoter.json')
    },

    tokens: {
        '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707': { symbol: 'WETH' },
        '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0': { symbol: 'UNI' },
        '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512': { symbol: 'USDC' },
        '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9': { symbol: 'USDT' },
        '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9': { symbol: 'WBTC' },
    }
}

