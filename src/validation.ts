export type ProductDraft = {
  uploaded: boolean
  uploadStatus: "idle" | "uploading" | "done" | "error"
  title: string
  price: string
  description: string
  category: string
  condition: string
  dimensions: string
  area: string
  method: string
  pickupDate: string
  startTime: string
  endTime: string
}

type BookingLike = {
  productId: number
  date: string
  time: string
  status: string
}

export const furnitureCategories = ["家具", "收纳用品"]

export function localDate(days = 0) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function validatePrice(value: string) {
  if (!value.trim()) return "请输入商品价格。"
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    return "价格最多保留两位小数，且不能包含字母。"
  const price = Number(value)
  if (!Number.isFinite(price) || price <= 0) return "商品价格必须大于 0 DKK。"
  if (price > 100000) return "商品价格不能超过 100,000 DKK，请人工检查价格。"
  return ""
}

export function validateProductStep(step: number, draft: ProductDraft) {
  const errors: Record<string, string> = {}
  if (step === 1) {
    if (!draft.uploaded) errors.image = "请至少上传一张商品图片。"
    if (draft.uploadStatus === "uploading")
      errors.image = "图片仍在上传，请稍候。"
    if (draft.uploadStatus === "error") errors.image = "图片上传失败，请重试。"
  }
  if (step === 2) {
    const title = draft.title.trim()
    if (!title) errors.title = "请输入商品标题。"
    else if (title.length < 5 || title.length > 60)
      errors.title = "商品标题需为 5–60 个字符。"
    if (
      !draft.category ||
      ![
        "家具",
        "自行车",
        "厨房用品",
        "小家电",
        "灯具",
        "生活用品",
        "电子设备",
        "教材/宿舍",
        "收纳用品",
      ].includes(draft.category)
    ) {
      errors.category = "请选择商品分类。"
    }
    const priceError = validatePrice(draft.price)
    if (priceError) errors.price = priceError
    if (!draft.condition) errors.condition = "请选择商品成色。"
    const description = draft.description.trim()
    if (!description) errors.description = "请输入商品描述。"
    else if (description.length < 10)
      errors.description = "商品描述至少需要 10 个字符。"
    else if (description.length > 2000)
      errors.description = "商品描述不能超过 2,000 个字符。"
    if (furnitureCategories.includes(draft.category)) {
      if (!draft.dimensions.trim())
        errors.dimensions = "家具及收纳商品必须填写尺寸。"
      else {
        const values = draft.dimensions.match(/\d+(\.\d+)?/g)?.map(Number) || []
        if (
          !values.length ||
          values.some((value) => !Number.isFinite(value) || value <= 0)
        ) {
          errors.dimensions = "请输入大于 0 的厘米尺寸，例如 105 × 50 × 75。"
        }
      }
    }
  }
  if (step === 3) {
    if (!draft.area || draft.area === "全部区域")
      errors.area = "请选择交易区域。"
    if (!draft.method) errors.method = "请选择交付方式。"
    if (!draft.pickupDate) errors.pickupDate = "请选择可取货日期。"
    else if (draft.pickupDate < localDate())
      errors.pickupDate = "取货时间不能早于当前时间。"
    if (!draft.startTime || !draft.endTime)
      errors.time = "请选择完整的可取货时段。"
    else if (draft.endTime <= draft.startTime)
      errors.time = "截止时间必须晚于开始时间。"
  }
  return errors
}

export function validateBooking(
  date: string,
  time: string,
  status: string,
  existing?: BookingLike,
  productId?: number,
) {
  if (status === "已售出" || status === "已下架") return "该商品当前不可预约。"
  if (!date) return "请选择取货日期。"
  if (date < localDate()) return "取货时间不能早于当前时间。"
  if (!time) return "请选择具体取货时段。"
  if (time < "10:00" || time > "18:00")
    return "请选择卖家可取货时段 10:00–18:00。"
  if (
    existing &&
    existing.productId === productId &&
    existing.date === date &&
    existing.time === time &&
    ["待确认", "已确认"].includes(existing.status)
  )
    return "不能重复提交相同的有效预约。"
  return ""
}

export function validateEmail(email: string) {
  if (!email.trim()) return "请输入邮箱地址。"
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
    ? ""
    : "请填写正确的邮箱地址。"
}

export function validatePhone(phone: string, country: "DK" | "CN") {
  const digits = phone.replace(/\s/g, "")
  if (!digits) return "请输入手机号。"
  const valid =
    country === "DK"
      ? /^(\+45)?\d{8}$/.test(digits)
      : /^(\+86)?1[3-9]\d{9}$/.test(digits)
  return valid
    ? ""
    : country === "DK"
      ? "请输入有效的丹麦手机号（8 位）。"
      : "请输入有效的中国大陆手机号。"
}

export function validateMessage(message: string) {
  if (!message.trim()) return "消息内容不能为空。"
  if (message.trim().length > 500) return "单条消息不能超过 500 个字符。"
  return ""
}

export function validatePromotion(
  status: string,
  plan: number | null,
  start: string,
  end: string,
  confirmed: boolean,
) {
  if (status !== "在售") return "只有在售商品可以推广。"
  if (![9, 19, 39].includes(plan || 0)) return "请选择有效的推广方案。"
  if (!start || !end) return "请选择推广开始和结束时间。"
  if (start > end) return "推广开始时间不得晚于结束时间。"
  if (!confirmed) return "请确认推广费用及效果说明。"
  return ""
}
