import React, { useState, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { AutoColumn } from 'components/Column'
import { TYPE } from 'theme'
import { ResponsiveRow, RowBetween, RowFixed } from 'components/Row'
import LineChart from 'components/LineChart/alt'
import useTheme from 'hooks/useTheme'
import { useProtocolData, useProtocolChartData, useProtocolTransactions } from 'state/protocol/hooks'
import { DarkGreyCard } from 'components/Card'
import { formatDollarAmount } from 'utils/numbers'
import Percent from 'components/Percent'
import { ButtonText, HideMedium, HideSmall, StyledInternalLink } from '../../theme/components'
import TokenTable from 'components/tokens/TokenTable'
import PoolTable from 'components/pools/PoolTable'
import { PageWrapper } from 'pages/styled'
import { unixToDate } from 'utils/date'
import BarChart from 'components/BarChart/alt'
import { useAllPoolData } from 'state/pools/hooks'
import { notEmpty } from 'utils'
import TransactionsTable from '../../components/TransactionsTable'
import { useAllTokenData } from 'state/tokens/hooks'
import { MonoSpace } from 'components/shared'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useTransformedVolumeData } from 'hooks/chart'
import { SmallOptionButton } from 'components/Button'
import { VolumeWindow } from 'types'
import useAggregatorVolume from 'hooks/useAggregatorVolume'
import { Text } from 'rebass'

const ChartWrapper = styled.div`
  width: 49%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

const StatisticWrapper = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column
    `}
`

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const theme = useTheme()

  const activeNetwork = useActiveNetworkVersion()

  const [protocolData] = useProtocolData()
  const [chartData] = useProtocolChartData()
  const [transactions] = useProtocolTransactions()

  const [volumeHover, setVolumeHover] = useState<number | undefined>()
  const [liquidityHover, setLiquidityHover] = useState<number | undefined>()
  const [leftLabel, setLeftLabel] = useState<string | undefined>()
  const [rightLabel, setRightLabel] = useState<string | undefined>()

  useEffect(() => {
    setLiquidityHover(undefined)
    setVolumeHover(undefined)
  }, [activeNetwork])

  // get all the pool datas that exist
  const allPoolData = useAllPoolData()
  const poolDatas = useMemo(() => {
    return Object.values(allPoolData)
      .map((p) => p.data)
      .filter(notEmpty)
  }, [allPoolData])

  // if hover value undefined, reset to current day value
  useEffect(() => {
    if (volumeHover === undefined && protocolData) {
      setVolumeHover(protocolData.volumeUSD)
    }
  }, [protocolData, volumeHover])
  useEffect(() => {
    if (liquidityHover === undefined && protocolData) {
      setLiquidityHover(protocolData.tvlUSD)
    }
  }, [liquidityHover, protocolData])

  const formattedTvlData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.tvlUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedVolumeData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.volumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const weeklyVolumeData = useTransformedVolumeData(chartData, 'week')
  const monthlyVolumeData = useTransformedVolumeData(chartData, 'month')

  const allTokens = useAllTokenData()

  const formattedTokens = useMemo(() => {
    return Object.values(allTokens)
      .map((t) => t.data)
      .filter(notEmpty)
  }, [allTokens])

  const [volumeWindow, setVolumeWindow] = useState(VolumeWindow.daily)

  const [showTotalVol, setShowTotalVol] = useState(true)
  const aggregatorVol = useAggregatorVolume()

  return (
    <PageWrapper>
      {/* <ThemedBackgroundGlobal backgroundColor={activeNetwork.bgColor} /> */}
      <AutoColumn gap="16px">
        <TYPE.label fontSize="24px">Summary</TYPE.label>

        <StatisticWrapper>
          <DarkGreyCard>
            <AutoColumn gap="8px">
              <RowBetween>
                <TYPE.main fontSize="12px">Trading Volume</TYPE.main>

                <RowFixed>
                  <ButtonText
                    onClick={() => setShowTotalVol(true)}
                    style={{ fontWeight: 500, fontSize: '12px', color: showTotalVol ? theme.primary : theme.subText }}
                  >
                    All time
                  </ButtonText>
                  <ButtonText
                    onClick={() => setShowTotalVol(false)}
                    style={{
                      fontWeight: 500,
                      marginLeft: '8px',
                      fontSize: '12px',
                      color: !showTotalVol ? theme.primary : theme.subText,
                    }}
                  >
                    24H
                  </ButtonText>
                </RowFixed>
              </RowBetween>
              <RowFixed mr="20px">
                <Text fontWeight="500" fontSize="18px">
                  {formatDollarAmount(showTotalVol ? aggregatorVol.totalVolume : aggregatorVol.last24hVolume)}
                </Text>
              </RowFixed>
            </AutoColumn>
          </DarkGreyCard>
          <DarkGreyCard>
            <TYPE.main fontSize="12px">Fees 24H</TYPE.main>
            <RowBetween style={{ marginTop: '8px' }}>
              <TYPE.label fontSize="18px">{formatDollarAmount(protocolData?.feesUSD)}</TYPE.label>
              <Percent simple value={protocolData?.feeChange} wrap={true} />
            </RowBetween>
          </DarkGreyCard>
          <DarkGreyCard>
            <TYPE.main fontSize="12px">Transactions (24H)</TYPE.main>
            <RowBetween style={{ marginTop: '8px' }}>
              <TYPE.label fontSize="18px">{protocolData?.txCount}</TYPE.label>
              <Percent simple value={protocolData?.txCountChange} wrap={true} />
            </RowBetween>
          </DarkGreyCard>
        </StatisticWrapper>

        <ResponsiveRow>
          <ChartWrapper>
            <LineChart
              data={formattedTvlData}
              height={220}
              minHeight={332}
              color={theme.primary}
              value={liquidityHover}
              label={leftLabel}
              setValue={setLiquidityHover}
              setLabel={setLeftLabel}
              topLeft={
                <AutoColumn gap="4px">
                  <TYPE.label fontSize="16px">TVL</TYPE.label>
                  <TYPE.largeHeader fontSize="32px">
                    <MonoSpace>{formatDollarAmount(liquidityHover, 2, true)} </MonoSpace>
                  </TYPE.largeHeader>
                  <TYPE.main fontSize="12px" height="14px">
                    {leftLabel ? <MonoSpace>{leftLabel} (UTC)</MonoSpace> : null}
                  </TYPE.main>
                </AutoColumn>
              }
            />
          </ChartWrapper>
          <ChartWrapper>
            <BarChart
              height={220}
              minHeight={332}
              data={
                volumeWindow === VolumeWindow.monthly
                  ? monthlyVolumeData
                  : volumeWindow === VolumeWindow.weekly
                  ? weeklyVolumeData
                  : formattedVolumeData
              }
              color={theme.primary}
              setValue={setVolumeHover}
              setLabel={setRightLabel}
              value={volumeHover}
              label={rightLabel}
              activeWindow={volumeWindow}
              topRight={
                <RowFixed style={{ marginLeft: '-40px', marginTop: '8px' }}>
                  <SmallOptionButton
                    active={volumeWindow === VolumeWindow.daily}
                    onClick={() => setVolumeWindow(VolumeWindow.daily)}
                  >
                    D
                  </SmallOptionButton>
                  <SmallOptionButton
                    active={volumeWindow === VolumeWindow.weekly}
                    style={{ marginLeft: '8px' }}
                    onClick={() => setVolumeWindow(VolumeWindow.weekly)}
                  >
                    W
                  </SmallOptionButton>
                  <SmallOptionButton
                    active={volumeWindow === VolumeWindow.monthly}
                    style={{ marginLeft: '8px' }}
                    onClick={() => setVolumeWindow(VolumeWindow.monthly)}
                  >
                    M
                  </SmallOptionButton>
                </RowFixed>
              }
              topLeft={
                <AutoColumn gap="4px">
                  <TYPE.label fontSize="16px">Volume 24H</TYPE.label>
                  <TYPE.largeHeader fontSize="32px">
                    <MonoSpace> {formatDollarAmount(volumeHover, 2)}</MonoSpace>
                  </TYPE.largeHeader>
                  <TYPE.main fontSize="12px" height="14px">
                    {rightLabel ? <MonoSpace>{rightLabel} (UTC)</MonoSpace> : null}
                  </TYPE.main>
                </AutoColumn>
              }
            />
          </ChartWrapper>
        </ResponsiveRow>
        <RowBetween>
          <TYPE.label>Top Tokens</TYPE.label>
          <StyledInternalLink to="tokens">Explore</StyledInternalLink>
        </RowBetween>
        <TokenTable tokenDatas={formattedTokens} maxItems={10} />
        <RowBetween>
          <TYPE.label>Top Pools</TYPE.label>
          <StyledInternalLink to="pools">Explore</StyledInternalLink>
        </RowBetween>
        <PoolTable poolDatas={poolDatas} />
        <RowBetween>
          <TYPE.label>Transactions</TYPE.label>
        </RowBetween>
        {transactions ? <TransactionsTable transactions={transactions} maxItems={5} /> : null}
      </AutoColumn>
    </PageWrapper>
  )
}
