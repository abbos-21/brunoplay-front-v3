import client from './client';
import type { WithdrawalInfo, Withdrawal, PaginatedResponse, TopupPacks, TopupOrder } from '@/types';

// === Withdrawals ===
export function getWithdrawalInfo() {
  return client.get<WithdrawalInfo>('/withdrawals/info').then((r) => r.data);
}

export function createWithdrawal(targetAddress: string, amountCoins: number) {
  return client.post<{ withdrawal: Withdrawal }>('/withdrawals', { targetAddress, amountCoins }).then((r) => r.data.withdrawal);
}

export function getWithdrawalHistory(page = 1) {
  return client.get<PaginatedResponse<Withdrawal>>('/withdrawals', { params: { page } }).then((r) => r.data);
}

export function cancelWithdrawal(id: number) {
  return client.post<{ withdrawal: Withdrawal }>(`/withdrawals/${id}/cancel`).then((r) => r.data.withdrawal);
}

// === Stars top-up ===
export function getTopupPacks() {
  return client.get<TopupPacks>('/topup/packs').then((r) => r.data);
}

/** A Telegram Stars invoice for a pack; open `invoiceLink` with Telegram.WebApp.openInvoice. */
export function createTelegramInvoice(packStars: number) {
  return client.post<TopupOrder>('/topup/telegram-invoice', { packStars }).then((r) => r.data);
}

/** A TON order: send `amountNano` to `address` with the `payload` comment (TON Connect). */
export function createTonOrder(packStars: number) {
  return client.post<TopupOrder>('/topup/ton-order', { packStars }).then((r) => r.data);
}

export function getTopupOrder(id: string) {
  return client.get<TopupOrder>(`/topup/orders/${id}`).then((r) => r.data);
}
