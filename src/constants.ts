export const contractConfig = {
    wethAddress: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    uniAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    usdcAddress : '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    usdtAddress : '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    wbtcAddress : '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    factoryAddress : '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    managerAddress : '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    quoterAddress : '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
    USDT_USDC_address : '0x158C0b648883f250D4B1979CB78D844c6D1B6dB8',
    WBTC_USDT_address : '0xaD68de22f2A6e6429a2D08fC27A6f3B16704A945',
    WETH_UNI_address : '0x5e85F9167259F3a0430fE1D26467435E7D5b986A',
    WETH_USDC_address : '0xD628628D91EEe8f60412a4Ff34f9261f157119Ba',
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

