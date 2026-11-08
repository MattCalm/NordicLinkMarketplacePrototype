import type { Status } from "./data"

export interface RouteEntry<T extends string> {
  view: T
  scroll: number
}

export function pushRoute<T extends string>(
  stack: RouteEntry<T>[],
  view: T,
  scroll = 0,
) {
  const current = stack.length ? stack : [{ view, scroll: 0 }]
  return [
    ...current.slice(0, -1),
    { ...current[current.length - 1], scroll },
    { view, scroll: 0 },
  ]
}

export function replaceRoute<T extends string>(
  stack: RouteEntry<T>[],
  view: T,
) {
  return [...stack.slice(0, -1), { view, scroll: 0 }]
}

export function popRoute<T extends string>(
  stack: RouteEntry<T>[],
  fallback: T,
) {
  return stack.length > 1 ? stack.slice(0, -1) : [{ view: fallback, scroll: 0 }]
}

export function statusForAppointment(
  appointmentStatus: "待确认" | "已确认" | "已拒绝" | "已取消" | "已完成",
): Status {
  if (appointmentStatus === "已完成") return "已售出"
  if (appointmentStatus === "已取消" || appointmentStatus === "已拒绝")
    return "在售"
  return "已预订"
}

export function feeBreakdown(price: number, firstTrade = true) {
  const standardFee = Math.round(price * 0.02 * 100) / 100
  const discount = firstTrade ? standardFee : 0
  return {
    standardFee,
    discount,
    actualFee: standardFee - discount,
    sellerReceivable: price - (standardFee - discount),
  }
}
