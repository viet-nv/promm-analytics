import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { AutoColumn } from '../Column'
import { Bookmark, ChevronRight, X } from 'react-feather'
import { Text, Flex } from 'rebass'
import useTheme from 'hooks/useTheme'
import { Divider } from 'components/Layout/styled'
import { useSavedPools, useSavedTokens } from 'state/user/hooks'
import { NetworkMap, SupportedNetwork } from 'constants/networks'
import { networkPrefix } from 'utils/networkPrefix'
import HoverInlineText from 'components/HoverInlineText'

const RightColumn = styled.div<{ open: boolean }>`
  position: sticky;
  right: 0;
  top: 0;
  bottom: 0;
  height: 100vh;
  background-color: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `}

  :hover {
    cursor: pointer;
  }
`

const SavedButton = styled(RowBetween)`
  padding-bottom: ${({ open }) => open && '20px'};
  padding: 40px 20px 20px;
  border-bottom: ${({ theme, open }) => open && '1px solid ' + theme.border};

  :hover {
    cursor: pointer;
  }
`

const ScrollableDiv = styled.div`
  overflow: auto;
  padding: 20px;
  padding-bottom: 60px;
  height: calc(100vh - 90px);
`

const TagItem = styled(Link)`
  cursor: pointer;
  border-radius: 999px;
  font-size: 12px;
  padding: 6px 8px;
  background-color: ${({ theme }) => theme.subText + '33'};
  color: ${({ theme }) => theme.subText};
  display: flex;
  gap: 6px;
  align-items: center;
  text-decoration: none;
`

function PinnedData({ open, setSavedOpen }: { open: boolean; setSavedOpen: (value: boolean) => void }) {
  const theme = useTheme()

  const [savedTokens, updatedSavedTokens] = useSavedTokens()
  const [savedPools, updateSavedPools] = useSavedPools()

  return !open ? (
    <RightColumn open={open} onClick={() => setSavedOpen(true)}>
      <SavedButton open={open}>
        <Bookmark size={20} color={theme.subText} />
      </SavedButton>
    </RightColumn>
  ) : (
    <RightColumn open={open}>
      <SavedButton onClick={() => setSavedOpen(false)} open={open}>
        <Flex alignItems="center">
          <Text fontWeight="500">Watchlist</Text>
        </Flex>
        <ChevronRight color={theme.subText} size={24} />
      </SavedButton>

      <ScrollableDiv>
        <Text fontWeight="500">Tokens</Text>
        {Object.keys(NetworkMap).map((key) => {
          const id: SupportedNetwork = Number(key)
          const tokens = Object.values(savedTokens[id] || {})
          return tokens.map((token) => (
            <Flex marginTop="16px" key={id + '-' + token.address} justifyContent="space-between" alignItems="center">
              <TagItem role="button" to={networkPrefix(NetworkMap[id]) + `tokens/${token.address}`}>
                <img src={NetworkMap[id].imageURL} width="16px" height="16px" alt="" />
                {token.symbol}
              </TagItem>
              <X color={theme.subText} role="button" onClick={() => updatedSavedTokens(id, token)} size={24} />
            </Flex>
          ))
        })}

        <Flex marginTop="20px" />
        <Divider />
        <Text marginTop="20px" fontWeight="500">
          Pools
        </Text>

        {Object.keys(NetworkMap).map((key) => {
          const id: SupportedNetwork = Number(key)
          const pools = Object.values(savedPools[id] || {})
          return pools.map((pool) => (
            <Flex marginTop="16px" key={id + '-' + pool.address} justifyContent="space-between" alignItems="center">
              <TagItem role="button" to={networkPrefix(NetworkMap[id]) + `pools/${pool.address}`}>
                <img src={NetworkMap[id].imageURL} width="16px" height="16px" alt="" />
                <HoverInlineText
                  maxCharacters={18}
                  text={`${pool.token0.symbol}/${pool.token1.symbol} (${pool.feeTier / 100}%)`}
                ></HoverInlineText>
              </TagItem>
              <X color={theme.subText} role="button" onClick={() => updateSavedPools(id, pool)} size={24} />
            </Flex>
          ))
        })}
      </ScrollableDiv>
    </RightColumn>
  )
}

export default PinnedData
