import logo from './icons/logo.png'


import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'
import coinbaseModule from '@web3-onboard/coinbase'

// Replace with your DApp's Infura ID
const INFURA_ID = 'cea9deb6467748b0b81b920b005c10c1'

const dappId = '1730eff0-9d50-4382-a3fe-89f0d34a2070'

const injected = injectedModule()
const coinbase = coinbaseModule()
const walletConnect = walletConnectModule()

export const initWeb3Onboard = init({
  wallets: [
    injected,
    // ledger,
    walletConnect,
    coinbase,
    // trezor,
    // web3auth,
    // gnosis,
    // magic,
    // fortmatic,
    // keepkey,
    // portis,
    // torus,
    // sequence
  ],
  chains: [
    {
      id: '0xa',
      token: 'ETH',
      label: 'Optimism',
      rpcUrl: `https://mainnet.optimism.io`,
    },
    {
      id: '0x5',
      token: 'rETH',
      label: 'Gorli',
      rpcUrl: `https://eth-goerli.public.blastapi.io`,
    },
  ],
  appMetadata: {
    name: 'Candide Security',
    icon: logo,
    logo: logo,
    description: 'Wallet Recovery',
  },
  accountCenter: {
    desktop: {
      position: 'topRight',
      enabled: true,
      minimal: false
    }
  },
  apiKey: dappId,
  notify: {
    transactionHandler: transaction => {
      console.log({ transaction })
      if (transaction.eventCode === 'txPool') {
        return {
          // autoDismiss set to zero will persist the notification until the user excuses it
          autoDismiss: 0,
          // message: `Your transaction is pending, click <a href="https://rinkeby.etherscan.io/tx/${transaction.hash}" rel="noopener noreferrer" target="_blank">here</a> for more info.`,
          // or you could use onClick for when someone clicks on the notification itself
          onClick: () =>
            window.open(`https://rinkeby.etherscan.io/tx/${transaction.hash}`)
        }
      }
    }
  }
})
