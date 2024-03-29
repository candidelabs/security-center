import logo from './icons/logo.png'

import { init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'
import coinbaseModule from '@web3-onboard/coinbase'

const wcV2InitOptions = {
  projectId: process.env.REACT_APP_WC_KEY,
  requiredChains: [10],
  dappUrl: "http://security.candidewallet.com",
};


const injected = injectedModule()
const coinbase = coinbaseModule()
const walletConnect = walletConnectModule(wcV2InitOptions)

export const initWeb3Onboard = init({
  wallets: [injected, walletConnect, coinbase],
  chains: [
    // {
    //   id: '0x5',
    //   token: 'gETH',
    //   label: 'Gorli',
    //   rpcUrl: process.env.REACT_APP_GOERLI_RPC
    // },
    // {
    //   id: '0x1a4',
    //   token: 'ETH',
    //   label: 'Optimism Gorli',
    //   rpcUrl: process.env.REACT_APP_OPTIMISM_GOERLI_RPC
    // },
    {
      id: '0xa',
      token: 'ETH',
      label: 'Optimism',
      rpcUrl: process.env.REACT_APP_OPTIMISM
    },
  ],
  appMetadata: {
    name: 'Candide Security',
    icon: logo,
    logo: logo,
    description: 'Wallet Recovery'
  },
  accountCenter: {
    desktop: {
      position: 'bottomRight',
      enabled: true,
      minimal: false
    },
    mobile: {
      position: 'bottomRight',
      enabled: true,
      minimal: true
    }
  },
  apiKey: process.env.REACT_BLOCKNATIVE_KEY,
  notify: {
    transactionHandler: transaction => {
      console.log({ transaction })
      if (transaction.eventCode === 'txPool') {
        return {
          // autoDismiss set to zero will persist the notification until the user excuses it
          autoDismiss: 0,
          // TODO: ensure we set up the proper block explorers for each chain
          onClick: () =>
            window.open(`https://optimism.etherscan.io/tx/${transaction.hash}`)
        }
      }
    }
  }
})
