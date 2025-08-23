import Web3 from 'web3';

// BEP-20 Token ABI (minimal required functions)
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
];

class Web3Service {
  private web3: Web3;
  private bscRpcUrl = 'https://bsc-dataseed1.binance.org/';

  constructor() {
    this.web3 = new Web3(this.bscRpcUrl);
  }

  // Generate a new wallet address and private key
  generateWallet() {
    const account = this.web3.eth.accounts.create();
    return {
      address: account.address,
      privateKey: account.privateKey,
    };
  }

  // Get token information from contract
  async getTokenInfo(contractAddress: string) {
    try {
      const contract = new this.web3.eth.Contract(ERC20_ABI as any, contractAddress);
      
      const [name, symbol, decimals] = await Promise.all([
        contract.methods.name().call(),
        contract.methods.symbol().call(),
        contract.methods.decimals().call(),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        contractAddress,
      };
    } catch (error) {
      console.error('Error fetching token info:', error);
      throw new Error('Failed to fetch token information');
    }
  }

  // Get token balance for an address
  async getTokenBalance(contractAddress: string, walletAddress: string) {
    try {
      const contract = new this.web3.eth.Contract(ERC20_ABI as any, contractAddress);
      const balance = await contract.methods.balanceOf(walletAddress).call();
      const decimals = await contract.methods.decimals().call();
      
      // Convert from Wei to token units
      const balanceInTokens = this.web3.utils.fromWei(balance.toString(), 'ether');
      return balanceInTokens;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  }

  // Get BNB balance for an address
  async getBNBBalance(walletAddress: string) {
    try {
      const balance = await this.web3.eth.getBalance(walletAddress);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Error fetching BNB balance:', error);
      return '0';
    }
  }

  // Get token price from PancakeSwap (simplified)
  async getTokenPrice(contractAddress: string) {
    try {
      // PancakeSwap V2 Router address
      const pancakeRouterAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
      
      // WBNB address on BSC
      const wbnbAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
      
      // This is a simplified price fetch - in production you'd use PancakeSwap's price oracle
      // For now, return mock data
      return {
        priceUsd: '0.50',
        priceChange24h: '2.5',
        high24h: '0.52',
        low24h: '0.48',
        volume24h: '1000000',
        marketCap: '50000000',
      };
    } catch (error) {
      console.error('Error fetching token price:', error);
      return {
        priceUsd: '0.00',
        priceChange24h: '0.00',
        high24h: '0.00',
        low24h: '0.00',
        volume24h: '0.00',
        marketCap: '0.00',
      };
    }
  }

  // Validate if address is valid
  isValidAddress(address: string): boolean {
    return this.web3.utils.isAddress(address);
  }

  // Check if transaction exists
  async getTransaction(txHash: string) {
    try {
      const tx = await this.web3.eth.getTransaction(txHash);
      return tx;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }
}

export const web3Service = new Web3Service();
export default web3Service;