import logo from './icons/logo.png'


import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import magicModule from '@web3-onboard/magic'
import walletConnectModule from '@web3-onboard/walletconnect'
import coinbaseModule from '@web3-onboard/coinbase'

const dappId = '1730eff0-9d50-4382-a3fe-89f0d34a2070'

const injected = injectedModule()
const coinbase = coinbaseModule()
const walletConnect = walletConnectModule()
const magic = magicModule({
  // public API key
  apiKey: process.env.REACT_APP_MAGIC_LINK_PK,
})


export const initWeb3Onboard = init({
  wallets: [
    injected,
    walletConnect,
    coinbase,
    magic,
  ],
  chains: [
    {
      id: '0x5',
      token: 'gETH',
      label: 'Gorli',
      rpcUrl: process.env.REACT_APP_GOERLI_RPC,
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
    },
    mobile: {
      position: 'bottomRight',
      enabled: true,
      minimal: true,
    },
  },
  apiKey: dappId,
  notify: {
    transactionHandler: transaction => {
      console.log({ transaction })
      if (transaction.eventCode === 'txPool') {
        return {
          // autoDismiss set to zero will persist the notification until the user excuses it
          autoDismiss: 0,
          onClick: () =>
            window.open(`https://goerli.etherscan.io/tx/${transaction.hash}`)
        }
      }
    }
  }
})
