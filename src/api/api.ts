import { Asset, OrderBook, Order } from '../types'

const API_BASE_URL = process.env.REACT_APP_API_URL || ''

export const getOrderbook = async (asset: Asset): Promise<OrderBook> => {
  const response = await fetch(`${API_BASE_URL}/orderbook/${asset}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch orderbook')
  }
  
  return response.json()
}

export const sendTrade = async (order: Order): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Order failed')
  }
}