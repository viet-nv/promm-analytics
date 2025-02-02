import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { useAllPoolData } from 'state/pools/hooks'
import { useMemo } from 'react'
import { notEmpty } from 'utils'
import { TransactionType } from 'types'
import { formatTokenSymbol } from 'utils/tokens'

const USER_POSITIONS = (user: string) => {
  const queryString = `
  query positions {
    positions(where: {owner: "${user}"}, orderBy: amountDepositedUSD, orderDirection: desc, first: 100) {
      id
      owner
      pool {
        id
      }
      token0 {
        id
        symbol
      }
      token1 {
        symbol
        id
      }
      amountDepositedUSD
      depositedToken1
      depositedToken0
    }
  }
   `
  return gql(queryString)
}

export const TOP_POSITIONS = (poolIds: string[]) => {
  let poolStrings = `[`
  poolIds.forEach((id) => {
    poolStrings += `"${id}",`
  })
  poolStrings += ']'

  const queryString = `
  query positions {
    positions(where: {pool_in: ${poolStrings}}, orderBy: amountDepositedUSD, orderDirection: desc, first: 100) {
      id
      owner
      pool {
        id
      }
      token0 {
        id
        symbol
      }
      token1 {
        symbol
        id
      }
      amountDepositedUSD
    }
  }
   `
  return gql(queryString)
}

interface PositionFields {
  id: string
  owner: string
  token0: {
    id: string
    symbol: string
  }
  token1: {
    id: string
    symbol: string
  }
  pool: {
    id: string
  }
  amountDepositedUSD: string
  depositedToken1: string
  depositedToken0: string
}

interface PositionDataResponse {
  positions: PositionFields[]
}

/**
 * Fetch top addresses by liquidity
 */
export function useFetchedPositionsDatas(): {
  loading: boolean
  error: boolean
  data: PositionFields[] | undefined
} {
  const { dataClient } = useClients()

  const allPoolData = useAllPoolData()

  const poolDatas = useMemo(() => {
    return Object.values(allPoolData)
      .map((p) => p.data)
      .filter(notEmpty)
      .map((p) => p.address)
  }, [allPoolData])

  const { loading, error, data } = useQuery<PositionDataResponse>(TOP_POSITIONS(poolDatas), {
    client: dataClient,
  })

  return {
    loading: loading,
    error: !!error,
    data: data?.positions,
  }
}

export function useFetchedUserPositionData(address: string) {
  const { dataClient } = useClients()
  const { loading, error, data } = useQuery<PositionDataResponse>(USER_POSITIONS(address), {
    client: dataClient,
  })

  return {
    loading: loading,
    error: !!error,
    data: data?.positions,
  }
}

const GLOBAL_TRANSACTIONS = gql`
  query transactions($address: Bytes!) {
    mints(first: 500, orderBy: timestamp, orderDirection: desc, where: { owner: $address }, subgraphError: allow) {
      timestamp
      transaction {
        id
      }
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      owner
      sender
      origin
      amount0
      amount1
      amountUSD
    }
    swaps(first: 500, orderBy: timestamp, orderDirection: desc, where: { origin: $address }, subgraphError: allow) {
      timestamp
      transaction {
        id
      }
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      origin
      amount0
      amount1
      amountUSD
    }
    burns(first: 500, orderBy: timestamp, orderDirection: desc, where: { owner: $address }, subgraphError: allow) {
      timestamp
      transaction {
        id
      }
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      owner
      amount0
      amount1
      amountUSD
    }
  }
`

export function useUserTransactions(
  address: string
): {
  loading: boolean
  error: boolean
  data: any[]
} {
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery(GLOBAL_TRANSACTIONS, {
    client: dataClient,
    variables: {
      address,
    },
    fetchPolicy: 'cache-first',
  })

  const mints = data?.mints.map((m: any) => {
    return {
      type: TransactionType.MINT,
      hash: m.transaction.id,
      timestamp: m.timestamp,
      sender: m.origin,
      token0Symbol: formatTokenSymbol(m.pool.token0.id, m.pool.token0.symbol),
      token1Symbol: formatTokenSymbol(m.pool.token1.id, m.pool.token1.symbol),
      token0Address: m.pool.token0.id,
      token1Address: m.pool.token1.id,
      amountUSD: parseFloat(m.amountUSD),
      amountToken0: parseFloat(m.amount0),
      amountToken1: parseFloat(m.amount1),
    }
  })
  const burns = data?.burns.map((m: any) => {
    return {
      type: TransactionType.BURN,
      hash: m.transaction.id,
      timestamp: m.timestamp,
      sender: m.owner,
      token0Symbol: formatTokenSymbol(m.pool.token0.id, m.pool.token0.symbol),
      token1Symbol: formatTokenSymbol(m.pool.token1.id, m.pool.token1.symbol),
      token0Address: m.pool.token0.id,
      token1Address: m.pool.token1.id,
      amountUSD: parseFloat(m.amountUSD),
      amountToken0: parseFloat(m.amount0),
      amountToken1: parseFloat(m.amount1),
    }
  })

  const swaps = data?.swaps.map((m: any) => {
    return {
      type: TransactionType.SWAP,
      hash: m.transaction.id,
      timestamp: m.timestamp,
      sender: m.origin,
      token0Symbol: formatTokenSymbol(m.pool.token0.id, m.pool.token0.symbol),
      token1Symbol: formatTokenSymbol(m.pool.token1.id, m.pool.token1.symbol),
      token0Address: m.pool.token0.id,
      token1Address: m.pool.token1.id,
      amountUSD: parseFloat(m.amountUSD),
      amountToken0: parseFloat(m.amount0),
      amountToken1: parseFloat(m.amount1),
    }
  })

  return {
    loading: loading,
    error: !!error,
    data: [...(mints || []), ...(burns || []), ...(swaps || [])],
  }
}
