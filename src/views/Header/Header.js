import React from 'react'
import networkEnum from '../../networkEnum'
import BNLogo from '../../icons/blocknative-logo-dark.svg'
import avatarPlaceholder from '../../icons/avatar-placeholder.png'
import './Header.css'

const Header = props => {
  const { connectedChain, address, balance, ens } = props

  return (
    <header className="user-info-container">
      <a
        className="bn-logo-link"
        href="https://www.blocknative.com/"
        target="_blank"
        rel="noopener noreferrer"
        title="Blocknative Site"
      >
        <img className="bn-logo-demo" src={BNLogo} alt="Block Native Logo" />
      </a>
    </header>
  )
}

export default Header
