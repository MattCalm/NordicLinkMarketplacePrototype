import test from "node:test"
import assert from "node:assert/strict"
import {
  localDate,
  validateBooking,
  validateEmail,
  validateMessage,
  validatePrice,
  validateProductStep,
  validatePromotion,
} from "../src/validation.ts"
import {
  feeBreakdown,
  popRoute,
  pushRoute,
  replaceRoute,
  statusForAppointment,
} from "../src/workflow.ts"

const validDraft = {
  uploaded: true,
  uploadStatus: "done",
  title: "IKEA MICKE 白色书桌",
  price: "220.50",
  description: "保存良好的学习书桌，桌面干净且抽屉顺滑。",
  category: "家具",
  condition: "轻微使用痕迹",
  dimensions: "105 × 50 × 75",
  area: "Nørrebro",
  method: "买家自取",
  pickupDate: localDate(2),
  startTime: "10:00",
  endTime: "18:00",
}

test("商品发布拒绝缺图、空标题、无效价格和过去日期", () => {
  assert.equal(
    validateProductStep(1, { ...validDraft, uploaded: false }).image,
    "请至少上传一张商品图片。",
  )
  assert.ok(validateProductStep(2, { ...validDraft, title: " " }).title)
  assert.ok(validateProductStep(2, { ...validDraft, price: "0" }).price)
  assert.ok(validateProductStep(2, { ...validDraft, price: "-1" }).price)
  assert.ok(validateProductStep(2, { ...validDraft, category: "" }).category)
  assert.ok(
    validateProductStep(3, { ...validDraft, pickupDate: "2020-01-01" })
      .pickupDate,
  )
  assert.deepEqual(validateProductStep(2, validDraft), {})
  assert.deepEqual(validateProductStep(3, validDraft), {})
})

test("价格、登录和聊天边界校验", () => {
  assert.ok(validatePrice("Infinity"))
  assert.ok(validatePrice("12.345"))
  assert.ok(validatePrice("100001"))
  assert.ok(validateEmail("not-an-email"))
  assert.ok(validateMessage("   "))
  assert.ok(validateMessage("a".repeat(501)))
  assert.equal(validateEmail("demo@nordiclink.dk"), "")
})

test("预约拒绝售出、过去时间和重复请求", () => {
  assert.ok(validateBooking(localDate(1), "14:00", "已售出"))
  assert.ok(validateBooking("2020-01-01", "14:00", "在售"))
  assert.ok(
    validateBooking(
      localDate(1),
      "14:00",
      "在售",
      {
        productId: 1,
        date: localDate(1),
        time: "14:00",
        status: "待确认",
      },
      1,
    ),
  )
  assert.equal(validateBooking(localDate(1), "14:00", "在售"), "")
})

test("推广要求在售商品、有效方案、时间顺序和确认", () => {
  assert.ok(validatePromotion("已售出", 19, localDate(), localDate(2), true))
  assert.ok(validatePromotion("在售", null, localDate(), localDate(2), true))
  assert.ok(validatePromotion("在售", 19, localDate(3), localDate(2), true))
  assert.ok(validatePromotion("在售", 19, localDate(), localDate(2), false))
  assert.equal(
    validatePromotion("在售", 19, localDate(), localDate(2), true),
    "",
  )
})

test("导航栈按来源返回且成功页可被替换", () => {
  let stack = [{ view: "home", scroll: 0 }]
  stack = pushRoute(stack, "search", 320)
  stack = pushRoute(stack, "results", 0)
  stack = pushRoute(stack, "detail", 480)
  stack = pushRoute(stack, "chat", 0)
  stack = popRoute(stack, "home")
  assert.equal(stack.at(-1).view, "detail")
  stack = popRoute(stack, "home")
  assert.equal(stack.at(-1).view, "results")
  stack = replaceRoute(stack, "manage")
  assert.equal(stack.at(-1).view, "manage")
  assert.ok(!stack.some((entry) => entry.view === "results"))
})

test("预约与成交状态及 2% 服务费保持一致", () => {
  assert.equal(statusForAppointment("待确认"), "已预订")
  assert.equal(statusForAppointment("已确认"), "已预订")
  assert.equal(statusForAppointment("已取消"), "在售")
  assert.equal(statusForAppointment("已拒绝"), "在售")
  assert.equal(statusForAppointment("已完成"), "已售出")
  assert.deepEqual(feeBreakdown(220, true), {
    standardFee: 4.4,
    discount: 4.4,
    actualFee: 0,
    sellerReceivable: 220,
  })
})
