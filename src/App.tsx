import { Component, useEffect, useMemo, useState } from "react"
import { areas, categories, Product, productsSeed, Status } from "./data"
import {
  localDate,
  ProductDraft,
  validateBooking,
  validateEmail,
  validateMessage,
  validatePhone,
  validateProductStep,
  validatePromotion,
} from "./validation"
import {
  popRoute,
  pushRoute,
  replaceRoute,
  statusForAppointment,
} from "./workflow"

type Tab = "home" | "categories" | "sell" | "messages" | "profile"
type View = Tab | "search" | "results" | "detail" | "booking" | "chat" | "login" | "manage" | "favorites" | "orders" | "support" | "promo" | "reports" | "settings"
type NavEntry = { view: View scroll: number }
type PendingAction = { type: "view" view: View } | {
  type: "favorite"
  id: number
}
type Appointment = {
  productId: number
  date: string
  time: string
  note: string
  status: "待确认" | "已确认" | "已拒绝" | "已取消" | "已完成"
}
type AppState = {
  products: Product[]
  favorites: number[]
  messages: string[]
  appointment?: Appointment
  loggedIn: boolean
}
const initialState: AppState = {
  products: productsSeed,
  favorites: [],
  messages: ["你好，请问书桌还在吗？", "在的，周末可以来 Nørrebro 自取。"],
  loggedIn: true,
}

function Icon({ name, filled = false }: { name: string filled?: boolean }) {
  const p: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    chat: (
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    heart: (
      <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.8z" />
    ),
    back: <path d="m15 18-6-6 6-6" />,
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
      </>
    ),
    camera: (
      <>
        <rect x="3" y="6" width="18" height="14" rx="3" />
        <circle cx="12" cy="13" r="4" />
        <path d="m8 6 1.5-2h5L16 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
  }
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {p[name]}
    </svg>
  )
}

function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nordiclink-state") || "")
      return saved &&
        Array.isArray(saved.products) &&
        Array.isArray(saved.favorites) &&
        Array.isArray(saved.messages)
        ? { ...initialState, ...saved }
        : initialState
    } catch {
      return initialState
    }
  })
  const [tab, setTab] = useState<Tab>("home"),
    [stack, setStack] = useState<NavEntry[]>(() => {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("nordiclink-nav") || "[]",
        )
        const validViews: View[] = [
          "home",
          "categories",
          "sell",
          "messages",
          "profile",
          "search",
          "results",
          "detail",
          "booking",
          "chat",
          "login",
          "manage",
          "favorites",
          "orders",
          "support",
          "promo",
          "reports",
          "settings",
        ]
        return Array.isArray(saved) &&
          saved.length &&
          saved.every((entry) => validViews.includes(entry.view))
          ? saved
          : [{ view: "home", scroll: 0 }]
      } catch {
        return [{ view: "home", scroll: 0 }]
      }
    }),
    [selectedId, setSelectedId] = useState(
      () => Number(sessionStorage.getItem("nordiclink-product")) || 1,
    ),
    [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [query, setQuery] = useState(""),
    [area, setArea] = useState("全部区域"),
    [sort, setSort] = useState("综合推荐"),
    [maxPrice, setMaxPrice] = useState(1500)
  const [toast, setToast] = useState(""),
    [showSplash, setShowSplash] = useState(true),
    [demoRole, setDemoRole] = useState<"买家" | "卖家">("买家")
  useEffect(() => {
    localStorage.setItem("nordiclink-state", JSON.stringify(state))
  }, [state])
  useEffect(() => {
    sessionStorage.setItem("nordiclink-nav", JSON.stringify(stack))
  }, [stack])
  useEffect(() => {
    sessionStorage.setItem("nordiclink-product", String(selectedId))
  }, [selectedId])
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1300)
    return () => clearTimeout(t)
  }, [])
  const product =
    state.products.find((p) => p.id === selectedId) ||
    state.products[0] ||
    productsSeed[0]
  const appointmentProduct =
    state.products.find((p) => p.id === state.appointment?.productId) || product
  const notify = (s: string) => {
    setToast(s)
    setTimeout(() => setToast(""), 2200)
  }
  const getScroll = () =>
    window.innerWidth > 760
      ? (document.querySelector(".phone") as HTMLElement | null)?.scrollTop || 0
      : window.scrollY
  const restoreScroll = (top: number, behavior: ScrollBehavior = "auto") => {
    if (window.innerWidth > 760)
      (document.querySelector(".phone") as HTMLElement | null)?.scrollTo({
        top,
        behavior,
      })
    else window.scrollTo({ top, behavior })
  }
  const view = stack[stack.length - 1]?.view || "home"
  const push = (v: View) => {
    setStack((current) => pushRoute(current, v, getScroll()))
    restoreScroll(0, "smooth")
  }
  const replace = (v: View) => {
    setStack((current) => replaceRoute(current, v))
    restoreScroll(0, "smooth")
  }
  const back = () => {
    if (stack.length <= 1) {
      setTab("home")
      setStack([{ view: "home", scroll: 0 }])
      return
    }
    const target = stack[stack.length - 2]
    setStack((current) => popRoute(current, "home"))
    requestAnimationFrame(() => restoreScroll(target.scroll))
  }
  const goTab = (t: Tab) => {
    setTab(t)
    setStack([{ view: t, scroll: 0 }])
    restoreScroll(0)
  }
  const detail = (id: number) => {
    setSelectedId(id)
    push("detail")
  }
  const runPending = (action: PendingAction) => {
    if (action.type === "view") push(action.view)
    else {
      setState((s) => ({
        ...s,
        favorites: s.favorites.includes(action.id)
          ? s.favorites.filter((id) => id !== action.id)
          : [...s.favorites, action.id],
      }))
    }
  }
  const requireLogin = (action: PendingAction) => {
    if (state.loggedIn) runPending(action)
    else {
      setPendingAction(action)
      push("login")
    }
  }
  const toggleFavorite = (id: number) => requireLogin({ type: "favorite", id })
  const updateProduct = (id: number, patch: Partial<Product>) =>
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  if (showSplash) return <Splash />
  const standalone = ![
    "home",
    "categories",
    "sell",
    "messages",
    "profile",
  ].includes(view)
  return (
    <div className="app">
      <div className="desktop-rail">
        <Logo />
        <p>让丹麦生活的好物继续流转</p>
        <div className="demo-switch">
          <span>演示视角</span>
          <button
            onClick={() => setDemoRole(demoRole === "买家" ? "卖家" : "买家")}
          >
            {demoRole}视角 · 切换
          </button>
        </div>
      </div>
      <div className="phone">
        <ScreenErrorBoundary key={view} onHome={() => goTab("home")}>
          {view === "home" && (
            <Home
              products={state.products.filter((p) => p.status === "在售")}
              favorites={state.favorites}
              detail={detail}
              toggle={toggleFavorite}
              search={() => push("search")}
              category={(c) => {
                setQuery(c)
                push("results")
              }}
              notify={notify}
            />
          )}
          {view === "categories" && (
            <Categories products={state.products} detail={detail} />
          )}
          {view === "search" && (
            <Search
              query={query}
              setQuery={setQuery}
              back={back}
              submit={() => push("results")}
            />
          )}
          {view === "results" && (
            <Results
              products={state.products}
              query={query}
              area={area}
              setArea={setArea}
              sort={sort}
              setSort={setSort}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              back={back}
              detail={detail}
            />
          )}
          {view === "detail" && (
            <Detail
              p={product}
              liked={state.favorites.includes(product.id)}
              back={back}
              toggle={() => toggleFavorite(product.id)}
              chat={() => requireLogin({ type: "view", view: "chat" })}
              book={() => requireLogin({ type: "view", view: "booking" })}
              share={() => notify("分享链接已复制")}
            />
          )}
          {view === "chat" && (
            <Chat
              p={product}
              messages={state.messages}
              send={(m) =>
                setState((s) => ({ ...s, messages: [...s.messages, m] }))
              }
              back={back}
              booking={() => push("booking")}
            />
          )}
          {view === "booking" && (
            <Booking
              p={product}
              existing={
                state.appointment?.productId === product.id
                  ? state.appointment
                  : undefined
              }
              back={back}
              save={(a) => {
                setState((s) => ({
                  ...s,
                  appointment: a,
                  products: s.products.map((p) =>
                    p.id === product.id ? { ...p, status: "已预订" } : p,
                  ),
                }))
                notify("预约已发送给卖家")
              }}
              role={demoRole}
              update={(status) =>
                setState((s) => ({
                  ...s,
                  appointment: s.appointment
                    ? { ...s.appointment, status }
                    : undefined,
                  products: s.products.map((p) =>
                    p.id === product.id
                      ? {
                          ...p,
                          status: statusForAppointment(status),
                        }
                      : p,
                  ),
                }))
              }
            />
          )}
          {view === "sell" && (
            <Publish
              back={back}
              add={(p) => {
                setState((s) => ({ ...s, products: [p, ...s.products] }))
                setSelectedId(p.id)
              }}
              done={() => {
                replace("manage")
                notify("审核通过，商品已上架")
              }}
            />
          )}
          {view === "messages" && (
            <MessageList
              p={product}
              goChat={() => push("chat")}
              empty={false}
            />
          )}
          {view === "profile" && (
            <Profile
              state={state}
              role={demoRole}
              setRole={setDemoRole}
              go={push}
              logout={() => setState((s) => ({ ...s, loggedIn: false }))}
            />
          )}
          {view === "manage" && (
            <Manage
              products={state.products}
              back={back}
              detail={detail}
              update={updateProduct}
              promo={(id) => {
                setSelectedId(id)
                push("promo")
              }}
            />
          )}
          {view === "favorites" && (
            <SimpleList
              title="我的收藏"
              items={state.products.filter((p) =>
                state.favorites.includes(p.id),
              )}
              back={back}
              detail={detail}
            />
          )}
          {view === "orders" && (
            <Orders
              p={appointmentProduct}
              appointment={state.appointment}
              back={back}
              complete={() => {
                setState((s) => ({
                  ...s,
                  products: s.products.map((p) =>
                    p.id === appointmentProduct.id
                      ? { ...p, status: "已售出" }
                      : p,
                  ),
                  appointment: s.appointment
                    ? { ...s.appointment, status: "已完成" }
                    : undefined,
                }))
                notify("双方已确认，交易完成")
              }}
            />
          )}
          {view === "support" && <Support back={back} />}
          {view === "reports" && <Reports back={back} notify={notify} />}
          {view === "promo" && (
            <Promo
              p={product}
              back={back}
              success={() => {
                updateProduct(product.id, { promoted: true })
                notify("推广已生效，持续 3 天")
                replace("manage")
              }}
            />
          )}
          {view === "login" && (
            <Login
              back={back}
              login={() => {
                setState((s) => ({ ...s, loggedIn: true }))
                notify("登录成功")
                const action = pendingAction
                setPendingAction(null)
                back()
                if (action) setTimeout(() => runPending(action), 0)
              }}
            />
          )}
          {view === "settings" && <Settings back={back} notify={notify} />}
          {!standalone && <BottomNav active={tab} go={goTab} />}
        </ScreenErrorBoundary>
        {toast && (
          <div className="toast">
            <Icon name="check" />
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

class ScreenErrorBoundary extends Component<{
  children: React.ReactNode
  onHome: () => void
}, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="screen load-error">
          <div>
            <Icon name="close" />
          </div>
          <h2>页面加载失败</h2>
          <p>本地页面状态可能已失效，请返回首页后重试。</p>
          <button className="primary" onClick={this.props.onHome}>
            返回首页
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function Splash() {
  return (
    <div className="splash">
      <div className="splash-mark">N</div>
      <h1>NordicLink</h1>
      <p>让丹麦生活的好物继续流转</p>
      <div className="loader">
        <i />
      </div>
    </div>
  )
}
function Logo() {
  return (
    <div className="logo">
      <b>N</b>
      <span>NordicLink</span>
    </div>
  )
}
function Top({
  title,
  back,
  action,
}: {
  title: string
  back?: () => void
  action?: React.ReactNode
}) {
  return (
    <header className="top">
      <button className="icon-btn" onClick={back} aria-label="返回">
        {back && <Icon name="back" />}
      </button>
      <strong>{title}</strong>
      <div className="top-action">{action}</div>
    </header>
  )
}
function Home({
  products,
  favorites,
  detail,
  toggle,
  search,
  category,
  notify,
}: {
  products: Product[]
  favorites: number[]
  detail: (id: number) => void
  toggle: (id: number) => void
  search: () => void
  category: (c: string) => void
  notify: (s: string) => void
}) {
  return (
    <div className="screen home">
      <header className="home-head">
        <Logo />
        <button className="city">
          <Icon name="pin" />
          Copenhagen
        </button>
        <button className="bell" onClick={() => notify("你有 2 条新消息")}>
          <Icon name="bell" />
          <i>2</i>
        </button>
      </header>
      <button className="search-box" onClick={search}>
        <Icon name="search" />
        <span>搜索书桌、自行车、台灯…</span>
      </button>
      <div className="category-grid">
        {categories.map((c, i) => (
          <button key={c} onClick={() => category(c)}>
            <span>{["⌑", "⌁", "♨", "◫", "⌁", "◇", "▣", "▤"][i]}</span>
            {c}
          </button>
        ))}
      </div>
      <section className="campaign" onClick={() => category("毕业清仓")}>
        <div>
          <span>GRADUATION SALE</span>
          <h2>毕业清仓季</h2>
          <p>轻装出发，让好物继续流转</p>
          <button>逛逛清仓好物</button>
        </div>
        <div className="campaign-shape">
          20<small>%</small>
        </div>
      </section>
      <SectionTitle
        title="附近好物"
        subtitle="距你 5 km 内"
        action="查看全部"
      />
      <div className="chips">
        <button className="active">为你推荐</button>
        <button>最新上架</button>
        <button>价格友好</button>
      </div>
      <div className="product-grid">
        {products.slice(0, 16).map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            liked={favorites.includes(p.id)}
            detail={() => detail(p.id)}
            toggle={() => toggle(p.id)}
          />
        ))}
      </div>
    </div>
  )
}
function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: string
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && (
        <button>
          {action}
          <Icon name="chevron" />
        </button>
      )}
    </div>
  )
}
function ProductCard({
  p,
  liked = false,
  detail,
  toggle,
}: {
  p: Product
  liked?: boolean
  detail: () => void
  toggle?: () => void
}) {
  return (
    <article className="product-card" onClick={detail}>
      <div className="pic">
        <img src={p.image} alt={p.title} />
        {p.clearance && <span className="clearance-tag">毕业清仓</span>}
        {p.promoted && <span className="promoted">推广</span>}
        <button
          className={"heart " + (liked ? "liked" : "")}
          onClick={(e) => {
            e.stopPropagation()
            toggle?.()
          }}
        >
          <Icon name="heart" filled={liked} />
        </button>
      </div>
      <div className="product-info">
        <h3>{p.title}</h3>
        <strong>
          {p.price} <small>DKK</small>
        </strong>
        <p>
          <span>{p.condition}</span> · {p.area}
        </p>
      </div>
    </article>
  )
}
function Search({
  query,
  setQuery,
  back,
  submit,
}: {
  query: string
  setQuery: (s: string) => void
  back: () => void
  submit: () => void
}) {
  const recent = ["书桌", "自行车", "台灯"],
    hot = ["IKEA 家具", "显示器", "电饭煲", "毕业清仓"]
  return (
    <div className="screen">
      <Top title="搜索" back={back} />
      <div className="search-input">
        <Icon name="search" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="搜索你需要的好物"
        />
        {query && (
          <button onClick={() => setQuery("")}>
            <Icon name="close" />
          </button>
        )}
      </div>
      {query ? (
        <div className="suggest">
          <p>搜索建议</p>
          {[query, query + " IKEA", query + " 二手"].map((x) => (
            <button
              key={x}
              onClick={() => {
                setQuery(x)
                submit()
              }}
            >
              <Icon name="search" />
              <span>{x}</span>
              <Icon name="chevron" />
            </button>
          ))}
        </div>
      ) : (
        <>
          <SectionTitle title="最近搜索" action="清除" />
          <div className="tag-row">
            {recent.map((x) => (
              <button
                onClick={() => {
                  setQuery(x)
                  submit()
                }}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <SectionTitle title="大家都在搜" />
          <div className="tag-row hot">
            {hot.map((x, i) => (
              <button
                onClick={() => {
                  setQuery(x)
                  submit()
                }}
                key={x}
              >
                <i>{i + 1}</i>
                {x}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
function Results({
  products,
  query,
  area,
  setArea,
  sort,
  setSort,
  maxPrice,
  setMaxPrice,
  back,
  detail,
}: {
  products: Product[]
  query: string
  area: string
  setArea: (s: string) => void
  sort: string
  setSort: (s: string) => void
  maxPrice: number
  setMaxPrice: (price: number) => void
  back: () => void
  detail: (id: number) => void
}) {
  const [filterOpen, setFilterOpen] = useState(false)
  let list = products.filter(
    (p) =>
      p.status === "在售" &&
      (query === "毕业清仓"
        ? p.clearance
        : (p.title + p.category).toLowerCase().includes(query.toLowerCase())) &&
      (area === "全部区域" || p.area === area) &&
      p.price <= maxPrice,
  )
  if (sort === "价格升序") list = [...list].sort((a, b) => a.price - b.price)
  if (sort === "价格降序") list = [...list].sort((a, b) => b.price - a.price)
  return (
    <div className="screen">
      <Top title={`“${query || "全部"}”`} back={back} />
      <div className="result-tools">
        <button onClick={() => setFilterOpen(true)}>
          <Icon name="filter" />
          筛选{area !== "全部区域" && <i>1</i>}
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option>综合推荐</option>
          <option>最新发布</option>
          <option>价格升序</option>
          <option>价格降序</option>
          <option>距离优先</option>
        </select>
      </div>
      <p className="count">找到 {list.length} 件匹配商品</p>
      {list.length ? (
        <div className="product-grid">
          {list.map((p) => (
            <ProductCard key={p.id} p={p} detail={() => detail(p.id)} />
          ))}
        </div>
      ) : (
        <Empty title="没有找到相关好物" text="试试放宽价格或区域条件" />
      )}
      {filterOpen && (
        <div className="sheet-wrap" onClick={() => setFilterOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <Top
              title="筛选"
              back={() => setFilterOpen(false)}
              action={
                <button
                  onClick={() => {
                    setArea("全部区域")
                    setMaxPrice(1500)
                  }}
                >
                  重置
                </button>
              }
            />
            <label className="range">
              价格上限 <b>{maxPrice} DKK</b>
              <input
                type="range"
                min="50"
                max="1500"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(+e.target.value)}
              />
            </label>
            <h3>所在区域</h3>
            <div className="choice-grid">
              {areas.map((a) => (
                <button
                  className={area === a ? "active" : ""}
                  onClick={() => setArea(a)}
                  key={a}
                >
                  {a}
                </button>
              ))}
            </div>
            <h3>商品成色</h3>
            <div className="choice-grid">
              <button className="active">不限</button>
              <button>几乎全新</button>
              <button>使用良好</button>
              <button>有使用痕迹</button>
            </div>
            <button
              className="primary wide"
              onClick={() => setFilterOpen(false)}
            >
              查看 {list.length} 件商品
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
function Categories({
  products,
  detail,
}: {
  products: Product[]
  detail: (id: number) => void
}) {
  const [c, setC] = useState(categories[0])
  return (
    <div className="screen category-screen">
      <Top title="分类" />
      <div className="category-layout">
        <aside>
          {categories.map((x) => (
            <button
              className={x === c ? "active" : ""}
              onClick={() => setC(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </aside>
        <main>
          <div className="area-line">
            <b>{c}</b>
            <button>
              <Icon name="pin" />
              全城
            </button>
          </div>
          {products
            .filter((p) => p.category === c && p.status === "在售")
            .map((p) => (
              <button
                className="mini-product"
                key={p.id}
                onClick={() => detail(p.id)}
              >
                <img src={p.image} />
                <span>
                  <b>{p.title}</b>
                  <strong>{p.price} DKK</strong>
                  <small>
                    {p.area} · {p.condition}
                  </small>
                </span>
              </button>
            ))}
        </main>
      </div>
    </div>
  )
}
function Detail({
  p,
  liked,
  back,
  toggle,
  chat,
  book,
  share,
}: {
  p: Product
  liked: boolean
  back: () => void
  toggle: () => void
  chat: () => void
  book: () => void
  share: () => void
}) {
  const sold = p.status === "已售出" || p.status === "已下架"
  return (
    <div className="screen detail-screen">
      <div className="detail-hero">
        <img src={p.image} />
        <button className="floating left" onClick={back}>
          <Icon name="back" />
        </button>
        <div className="floating-actions">
          <button onClick={share}>
            <Icon name="share" />
          </button>
          <button className={liked ? "liked" : ""} onClick={toggle}>
            <Icon name="heart" filled={liked} />
          </button>
        </div>
        <span className="pager">1 / 3</span>
        {sold && <div className="sold-cover">{p.status}</div>}
      </div>
      <div className="detail-body">
        <div className="detail-title">
          <div>
            <h1>{p.title}</h1>
            <strong>
              {p.price} <small>DKK</small>
            </strong>
          </div>
          <span className={"state " + p.status}>{p.status}</span>
        </div>
        <div className="facts">
          <span>
            成色<b>{p.condition}</b>
          </span>
          <span>
            分类<b>{p.category}</b>
          </span>
          <span>
            交付<b>仅限自取</b>
          </span>
        </div>
        <section>
          <h2>商品描述</h2>
          <p>{p.description}</p>
        </section>
        <section>
          <h2>取货信息</h2>
          <div className="pickup">
            <Icon name="pin" />
            <div>
              <b>{p.area} · 距你约 2.4 km</b>
              <p>地铁站附近，确认预约后提供具体位置</p>
              <span>周六–周日 10:00–18:00</span>
            </div>
          </div>
        </section>
        <section className="seller">
          <div className="avatar">{p.seller[0]}</div>
          <div>
            <b>{p.seller}</b>
            <p>已认证 · 通常 1 小时内回复</p>
          </div>
          <button>
            查看主页
            <Icon name="chevron" />
          </button>
        </section>
        <div className="safe">线下见面前请勿提前付款，建议在公共场所验货</div>
      </div>
      <div className="action-bar">
        <button className={"save " + (liked ? "liked" : "")} onClick={toggle}>
          <Icon name="heart" filled={liked} />
          <span>{liked ? "已收藏" : "收藏"}</span>
        </button>
        <button className="secondary" onClick={chat}>
          联系卖家
        </button>
        <button className="primary" disabled={sold} onClick={book}>
          {sold ? "不可预约" : "预约取货"}
        </button>
      </div>
    </div>
  )
}
function Chat({
  p,
  messages,
  send,
  back,
  booking,
}: {
  p: Product
  messages: string[]
  send: (m: string) => void
  back: () => void
  booking: () => void
}) {
  const [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [sending, setSending] = useState(false)
  const submit = () => {
    if (sending) return
    const nextError = validateMessage(draft)
    if (nextError) {
      setError(nextError)
      return
    }
    setSending(true)
    setTimeout(() => {
      if (!navigator.onLine) {
        setError("网络连接失败，消息草稿已保留。请联网后重试。")
        setSending(false)
        return
      }
      send(draft.trim())
      setDraft("")
      setError("")
      setSending(false)
    }, 250)
  }
  return (
    <div className="screen chat-screen">
      <Top title={p.seller} back={back} action={<Icon name="more" />} />
      <div className="linked-product">
        <img src={p.image} />
        <div>
          <b>{p.title}</b>
          <strong>
            {p.price} DKK · {p.status}
          </strong>
        </div>
        <button onClick={booking}>预约</button>
      </div>
      <div className="chat-log">
        <time>今天 14:20</time>
        {messages.map((m, i) => (
          <div
            className={"bubble " + (i % 2 === 0 ? "mine" : "theirs")}
            key={i}
          >
            {m}
            <small>
              {14 + i}:2{i}
            </small>
          </div>
        ))}
      </div>
      <div className="quick">
        {[
          "商品还在吗？",
          "可以周末取货吗？",
          "请问具体尺寸是多少？",
          "价格可以商量吗？",
        ].map((x) => (
          <button onClick={() => setDraft(x)} key={x}>
            {x}
          </button>
        ))}
      </div>
      <div className="composer">
        <input
          value={draft}
          maxLength={500}
          onChange={(e) => {
            setDraft(e.target.value)
            setError("")
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="输入消息…"
        />
        <span className="message-count">{draft.length}/500</span>
        <button disabled={!draft.trim() || sending} onClick={submit}>
          <Icon name="send" />
        </button>
      </div>
      {error && (
        <div className="message-error">
          {error}
          <button onClick={submit}>重试</button>
        </div>
      )}
    </div>
  )
}
function MessageList({
  p,
  goChat,
  empty,
}: {
  p: Product
  goChat: () => void
  empty: boolean
}) {
  return (
    <div className="screen">
      <Top
        title="消息"
        action={<button className="text-btn">全部已读</button>}
      />
      <div className="segmented">
        <button className="active">全部</button>
        <button>未读 2</button>
        <button>预约</button>
      </div>
      {empty ? (
        <Empty title="暂无消息" text="咨询商品后，对话会显示在这里" />
      ) : (
        <>
          <button className="thread" onClick={goChat}>
            <div className="avatar">林</div>
            <div>
              <b>{p.seller}</b>
              <p>在的，周末可以来取。</p>
              <span>关于：{p.title}</span>
            </div>
            <time>
              14:32<i>2</i>
            </time>
            <img src={p.image} />
          </button>
          <button className="thread">
            <div className="avatar teal">陈</div>
            <div>
              <b>陈宇</b>
              <p>预约时间已确认</p>
              <span>关于：城市通勤自行车</span>
            </div>
            <time>昨天</time>
          </button>
        </>
      )}
    </div>
  )
}
function Booking({
  p,
  existing,
  back,
  save,
  role,
  update,
}: {
  p: Product
  existing?: Appointment
  back: () => void
  save: (a: Appointment) => void
  role: "买家" | "卖家"
  update: (s: Appointment["status"]) => void
}) {
  const dateOptions = [1, 2, 3].map((days) => localDate(days))
  const [date, setDate] = useState(""),
    [time, setTime] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false)
  const submit = () => {
    if (saving) return
    const nextError = validateBooking(date, time, p.status, existing, p.id)
    if (nextError) {
      setError(nextError)
      return
    }
    setSaving(true)
    save({ productId: p.id, date, time, note: note.trim(), status: "待确认" })
    setSaving(false)
  }
  const activeExisting: Appointment | undefined =
    existing && !["已取消", "已拒绝"].includes(existing.status)
      ? existing
      : undefined
  return (
    <div className="screen">
      <Top title="预约取货" back={back} />
      <div className="booking-product">
        <img src={p.image} />
        <div>
          <b>{p.title}</b>
          <strong>{p.price} DKK</strong>
          <span>
            {p.area} · {p.seller}
          </span>
        </div>
      </div>
      {activeExisting ? (
        <div className="status-card">
          <span className={"status-dot " + activeExisting.status} />
          <p>预约状态</p>
          <h2>{activeExisting.status}</h2>
          <div>
            <b>
              {activeExisting.date} · {activeExisting.time}
            </b>
            <span>{p.area}，具体地址确认后可见</span>
          </div>
          {role === "卖家" && activeExisting.status === "待确认" ? (
            <div className="two-buttons">
              <button className="secondary" onClick={() => update("已拒绝")}>
                拒绝
              </button>
              <button className="primary" onClick={() => update("已确认")}>
                接受预约
              </button>
            </div>
          ) : !["已取消", "已拒绝", "已完成"].includes(
              activeExisting.status,
            ) ? (
            <button className="danger-link" onClick={() => update("已取消")}>
              取消预约
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <h3 className="form-title">选择日期</h3>
          <div className="date-row">
            {dateOptions.map((x) => (
              <button
                className={date === x ? "active" : ""}
                onClick={() => {
                  setDate(x)
                  setError("")
                }}
                key={x}
              >
                {new Intl.DateTimeFormat("zh-CN", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                }).format(new Date(`${x}T12:00:00`))}
              </button>
            ))}
          </div>
          <h3 className="form-title">选择时间</h3>
          <div className="time-grid">
            {["10:00", "12:00", "14:00", "16:00", "18:00"].map((x) => (
              <button
                className={time === x ? "active" : ""}
                onClick={() => {
                  setTime(x)
                  setError("")
                }}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <label className="field">
            给卖家留言（选填）
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：我会骑自行车过来，大约提前 10 分钟联系你"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button
            className="primary wide sticky-cta"
            disabled={saving || p.status === "已售出" || p.status === "已下架"}
            onClick={submit}
          >
            {saving
              ? "发送中…"
              : p.status === "已售出" || p.status === "已下架"
                ? "商品不可预约"
                : "发送预约请求"}
          </button>
        </>
      )}
    </div>
  )
}
function Publish({
  add,
  done,
  back,
}: {
  add: (p: Product) => void
  done: () => void
  back: () => void
}) {
  const [step, setStep] = useState(1),
    [uploaded, setUploaded] = useState(false),
    [uploadStatus, setUploadStatus] =
      useState<ProductDraft["uploadStatus"]>("idle"),
    [ai, setAi] = useState<"idle" | "loading" | "done" | "error">("idle"),
    [title, setTitle] = useState(""),
    [price, setPrice] = useState(""),
    [desc, setDesc] = useState(""),
    [cat, setCat] = useState(""),
    [condition, setCondition] = useState(""),
    [dimensions, setDimensions] = useState(""),
    [area, setArea] = useState(""),
    [method, setMethod] = useState(""),
    [pickupDate, setPickupDate] = useState(""),
    [startTime, setStartTime] = useState(""),
    [endTime, setEndTime] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [submitting, setSubmitting] = useState(false)
  const draft: ProductDraft = {
    uploaded,
    uploadStatus,
    title,
    price,
    description: desc,
    category: cat,
    condition,
    dimensions,
    area,
    method,
    pickupDate,
    startTime,
    endTime,
  }
  const clear = (key: string) =>
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  const showErrors = (nextErrors: Record<string, string>) => {
    setErrors(nextErrors)
    const first = Object.keys(nextErrors)[0]
    requestAnimationFrame(() =>
      document
        .querySelector(`[data-field="${first}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    )
    return Object.keys(nextErrors).length === 0
  }
  const upload = (fail = false) => {
    setUploadStatus("uploading")
    setErrors({})
    setTimeout(() => {
      if (fail) {
        setUploaded(false)
        setUploadStatus("error")
        setErrors({ image: "图片上传失败，请检查网络后重试。" })
      } else {
        setUploaded(true)
        setUploadStatus("done")
      }
    }, 450)
  }
  const generate = () => {
    setAi("loading")
    clear("ai")
    setTimeout(() => {
      if (!uploaded) {
        setAi("error")
        setErrors((current) => ({
          ...current,
          ai: "AI 生成失败：图片不可用，请重新上传后重试。",
        }))
        return
      }
      setAi("done")
      setTitle("IKEA MICKE 白色书桌")
      setDesc(
        "简约白色书桌，适合学习或居家办公。图片可见外观保存良好；实际尺寸、成色和内部状态请卖家补充确认。",
      )
      setCat("家具")
    }, 900)
  }
  const next = () => {
    if (!showErrors(validateProductStep(step, draft))) return
    setStep((s) => Math.min(5, s + 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const submit = () => {
    if (submitting) return
    const allErrors = {
      ...validateProductStep(1, draft),
      ...validateProductStep(2, draft),
      ...validateProductStep(3, draft),
    }
    if (!showErrors(allErrors)) {
      setStep(
        Object.keys(validateProductStep(1, draft)).length
          ? 1
          : Object.keys(validateProductStep(2, draft)).length
            ? 2
            : 3,
      )
      return
    }
    setSubmitting(true)
    const p: Product = {
      id: Date.now(),
      title: title.trim(),
      price: Number(price),
      category: cat,
      area,
      condition,
      image:
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=82",
      status: "在售",
      seller: "林可欣",
      description: desc.trim(),
    }
    add(p)
    setStep(5)
    setSubmitting(false)
  }
  return (
    <div className="screen publish">
      <Top
        title={step === 5 ? "发布结果" : "发布商品"}
        back={
          step > 1 && step < 5
            ? () => setStep((current) => current - 1)
            : step === 5
              ? undefined
              : back
        }
        action={
          step < 5 ? (
            <button className="text-btn" onClick={() => setErrors({})}>
              保存草稿
            </button>
          ) : null
        }
      />
      {step < 5 && (
        <div className="steps">
          {[1, 2, 3, 4].map((n) => (
            <span className={step >= n ? "active" : ""} key={n}>
              <i>{step > n ? <Icon name="check" /> : n}</i>
              <b>{["图片", "信息", "交付", "确认"][n - 1]}</b>
            </span>
          ))}
        </div>
      )}
      {step === 1 && (
        <>
          <div
            data-field="image"
            className={
              "upload-zone " +
              (uploaded ? "has-image" : "") +
              (errors.image ? " invalid" : "")
            }
            onClick={() => !uploaded && upload()}
          >
            {uploaded ? (
              <>
                <img src="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=82" />
                <span>封面</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploaded(false)
                    setUploadStatus("idle")
                  }}
                >
                  <Icon name="close" />
                </button>
              </>
            ) : (
              <>
                <Icon name="camera" />
                <b>
                  {uploadStatus === "uploading"
                    ? "正在上传…"
                    : "添加商品图片 *"}
                </b>
                <p>JPG、PNG 或 WebP，单张不超过 10MB</p>
              </>
            )}
          </div>
          {errors.image && <FieldError text={errors.image} />}
          {!uploaded && uploadStatus !== "uploading" && (
            <button className="test-link" onClick={() => upload(true)}>
              模拟上传失败
            </button>
          )}
          <button
            className="ai-button"
            disabled={!uploaded || ai === "loading"}
            onClick={generate}
          >
            <span>AI</span>
            <div>
              <b>{ai === "loading" ? "正在识别图片…" : "AI 帮我填写"}</b>
              <p>生成标题、分类和描述草稿</p>
            </div>
            <Icon name="chevron" />
          </button>
          {ai === "done" && (
            <div className="ai-result">
              <Icon name="check" />
              <span>识别完成，建议已准备好</span>
              <button onClick={() => setStep(2)}>查看并采纳</button>
            </div>
          )}
          {ai === "error" && (
            <div className="retry-box">
              <span>{errors.ai}</span>
              <button onClick={generate}>重新生成</button>
            </div>
          )}
          <div className="ai-note">
            AI
            不会判断真实尺寸、成色或设备内部状态，不确定的信息会留空，请你补充确认。
          </div>
        </>
      )}
      {step === 2 && (
        <div className="form">
          <label
            className={"field " + (errors.title ? "invalid" : "")}
            data-field="title"
          >
            商品标题 *
            <input
              maxLength={60}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                clear("title")
              }}
              placeholder="清楚描述品牌和品类"
            />
            <FieldMeta error={errors.title} count={`${title.length}/60`} />
          </label>
          <div
            className={"field " + (errors.category ? "invalid" : "")}
            data-field="category"
          >
            分类 *
            <select
              value={cat}
              onChange={(e) => {
                setCat(e.target.value)
                clear("category")
              }}
            >
              <option value="">请选择商品分类</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option>收纳用品</option>
            </select>
            <FieldError text={errors.category} />
          </div>
          <label
            className={"field " + (errors.price ? "invalid" : "")}
            data-field="price"
          >
            价格（DKK）*
            <input
              inputMode="decimal"
              value={price}
              onChange={(e) => {
                if (/^\d*(\.\d{0,2})?$/.test(e.target.value))
                  setPrice(e.target.value)
                clear("price")
              }}
              placeholder="0"
            />
            <FieldError text={errors.price} />
          </label>
          <div
            className={"field " + (errors.condition ? "invalid" : "")}
            data-field="condition"
          >
            商品成色 *
            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value)
                clear("condition")
              }}
            >
              <option value="">请选择明确成色</option>
              <option>全新未使用</option>
              <option>几乎全新</option>
              <option>轻微使用痕迹</option>
              <option>明显使用痕迹</option>
            </select>
            <FieldError text={errors.condition} />
          </div>
          {["家具", "收纳用品"].includes(cat) && (
            <label
              className={"field " + (errors.dimensions ? "invalid" : "")}
              data-field="dimensions"
            >
              商品尺寸（cm）*
              <input
                value={dimensions}
                onChange={(e) => {
                  setDimensions(e.target.value)
                  clear("dimensions")
                }}
                placeholder="例如 105 × 50 × 75"
              />
              <FieldError text={errors.dimensions} />
            </label>
          )}
          <label
            className={"field " + (errors.description ? "invalid" : "")}
            data-field="description"
          >
            商品描述 *
            <textarea
              maxLength={2000}
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value)
                clear("description")
              }}
            />
            <FieldMeta
              error={errors.description}
              count={`剩余 ${2000 - desc.length} 字`}
            />
          </label>
          <label className="check-row">
            <input type="checkbox" /> 接受合理议价
          </label>
        </div>
      )}
      {step === 3 && (
        <div className="form">
          <div
            className={"field " + (errors.area ? "invalid" : "")}
            data-field="area"
          >
            所在城区 *
            <select
              value={area}
              onChange={(e) => {
                setArea(e.target.value)
                clear("area")
              }}
            >
              <option value="">请选择交易区域</option>
              {areas.slice(1).map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <FieldError text={errors.area} />
          </div>
          <label className="field">
            大致取货位置（选填）
            <input defaultValue="" placeholder="例如 Nørrebro Station 附近" />
          </label>
          <label
            className={"field " + (errors.pickupDate ? "invalid" : "")}
            data-field="pickupDate"
          >
            可取货日期 *
            <input
              type="date"
              min={localDate()}
              value={pickupDate}
              onChange={(e) => {
                setPickupDate(e.target.value)
                clear("pickupDate")
              }}
            />
            <FieldError text={errors.pickupDate} />
          </label>
          <div
            className={"field " + (errors.time ? "invalid" : "")}
            data-field="time"
          >
            可取货时段 *
            <div className="inline-fields">
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  clear("time")
                }}
              />
              <span>至</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value)
                  clear("time")
                }}
              />
            </div>
            <FieldError text={errors.time} />
          </div>
          <div
            className={"field " + (errors.method ? "invalid" : "")}
            data-field="method"
          >
            交付方式 *
            <select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value)
                clear("method")
              }}
            >
              <option value="">请选择交付方式</option>
              <option>买家自取</option>
              <option>可协商送达</option>
            </select>
            <FieldError text={errors.method} />
          </div>
          <label className="field">
            搬运说明（选填）
            <textarea placeholder="楼层、电梯、是否可拆卸…" />
          </label>
        </div>
      )}
      {step === 4 && (
        <div className="preview-card">
          <img src="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=82" />
          <span>发布预览</span>
          <h2>{title}</h2>
          <strong>{price} DKK</strong>
          <p>{desc}</p>
          <ul>
            <li>
              分类<b>{cat}</b>
            </li>
            <li>
              区域<b>{area}</b>
            </li>
            <li>
              交付<b>{method}</b>
            </li>
          </ul>
          <div className="review-note">
            提交后将进入审核，通常在 10 分钟内完成。
          </div>
        </div>
      )}
      {step === 5 && (
        <div className="success-state">
          <div>
            <Icon name="check" />
          </div>
          <h1>发布成功</h1>
          <p>
            商品已通过模拟审核并上架
            <br />
            现在买家可以看到它了
          </p>
          <button className="primary wide" onClick={done}>
            管理我的商品
          </button>
        </div>
      )}
      {step < 4 && (
        <button className="primary wide sticky-cta" onClick={next}>
          下一步
        </button>
      )}
      {step === 4 && (
        <div className="two-buttons sticky-cta">
          <button className="secondary" onClick={() => setStep(2)}>
            返回修改
          </button>
          <button className="primary" disabled={submitting} onClick={submit}>
            {submitting ? "提交中…" : "提交审核"}
          </button>
        </div>
      )}
    </div>
  )
}
function FieldError({ text }: { text?: string }) {
  return text ? <span className="field-error">{text}</span> : null
}
function FieldMeta({ error, count }: { error?: string count: string }) {
  return (
    <span className="field-meta">
      <FieldError text={error} />
      <small>{count}</small>
    </span>
  )
}
function Profile({
  state,
  role,
  setRole,
  go,
  logout,
}: {
  state: AppState
  role: "买家" | "卖家"
  setRole: (r: "买家" | "卖家") => void
  go: (v: View) => void
  logout: () => void
}) {
  const groups = [
    [
      "我的购买",
      [
        ["heart", "收藏", state.favorites.length, "favorites"],
        ["chat", "咨询", 2, "messages"],
        ["calendar", "预约", state.appointment ? 1 : 0, "orders"],
        ["check", "已买到", 0, "orders"],
      ],
    ],
    [
      "我的出售",
      [
        ["grid", "我的发布", state.products.length, "manage"],
        ["more", "草稿箱", 1, "manage"],
        [
          "check",
          "在售商品",
          state.products.filter((p) => p.status === "在售").length,
          "manage",
        ],
        [
          "home",
          "已售商品",
          state.products.filter((p) => p.status === "已售出").length,
          "manage",
        ],
      ],
    ],
    [
      "运营服务",
      [
        ["plus", "商品置顶", 0, "manage"],
        ["grid", "清仓活动", 0, "manage"],
        ["bell", "降价提醒", 0, "favorites"],
      ],
    ],
    [
      "其他",
      [
        ["chat", "客服与帮助", 0, "support"],
        ["more", "举报记录", 1, "reports"],
        ["user", "设置", 0, "settings"],
      ],
    ],
  ] as const
  return (
    <div className="screen profile">
      <Top
        title="我的"
        action={
          <button className="icon-btn">
            <Icon name="more" />
          </button>
        }
      />
      <section className="profile-card">
        <div className="avatar big">林</div>
        <div>
          <h2>林可欣</h2>
          <p>已认证 · Copenhagen</p>
        </div>
        <button>
          <Icon name="chevron" />
        </button>
      </section>
      <div className="role-switch">
        <span>演示模式</span>
        <div>
          <button
            className={role === "买家" ? "active" : ""}
            onClick={() => setRole("买家")}
          >
            买家视角
          </button>
          <button
            className={role === "卖家" ? "active" : ""}
            onClick={() => setRole("卖家")}
          >
            卖家视角
          </button>
        </div>
      </div>
      {groups.map(([name, items]) => (
        <section className="menu-group" key={name}>
          <h3>{name}</h3>
          <div className="menu-grid">
            {items.map(([icon, label, count, target]) => (
              <button key={label} onClick={() => go(target as View)}>
                <span>
                  <Icon name={icon} />
                  {count > 0 && <i>{count}</i>}
                </span>
                <b>{label}</b>
              </button>
            ))}
          </div>
        </section>
      ))}
      <button
        className="logout"
        onClick={() => {
          logout()
          go("login")
        }}
      >
        退出登录
      </button>
      <p className="version">NordicLink · Prototype 1.0</p>
    </div>
  )
}
function Manage({
  products,
  back,
  detail,
  update,
  promo,
}: {
  products: Product[]
  back: () => void
  detail: (id: number) => void
  update: (id: number, p: Partial<Product>) => void
  promo: (id: number) => void
}) {
  const [status, setStatus] = useState<Status>("在售")
  const tabs: Status[] = [
    "草稿",
    "待审核",
    "在售",
    "已预订",
    "已售出",
    "已下架",
  ]
  return (
    <div className="screen">
      <Top title="商品管理" back={back} />
      <div className="tab-scroll">
        {tabs.map((t) => (
          <button
            className={status === t ? "active" : ""}
            onClick={() => setStatus(t)}
            key={t}
          >
            {t}
            <i>{products.filter((p) => p.status === t).length}</i>
          </button>
        ))}
      </div>
      {products.filter((p) => p.status === status).length ? (
        products
          .filter((p) => p.status === status)
          .map((p) => (
            <div className="manage-item" key={p.id}>
              <img src={p.image} />
              <div>
                <span>
                  {p.clearance && "毕业清仓 · "}
                  {p.area}
                </span>
                <b>{p.title}</b>
                <strong>{p.price} DKK</strong>
                <small>
                  {p.promoted ? "推广中 · 还剩 3 天" : "发布于今天"}
                </small>
              </div>
              <button onClick={() => detail(p.id)}>
                <Icon name="more" />
              </button>
              <footer>
                {status === "在售" && (
                  <>
                    <button onClick={() => promo(p.id)}>推广商品</button>
                    <button onClick={() => update(p.id, { status: "已下架" })}>
                      下架
                    </button>
                    <button
                      className="primary-mini"
                      onClick={() => update(p.id, { status: "已售出" })}
                    >
                      确认售出
                    </button>
                  </>
                )}
                {status === "已下架" && (
                  <button onClick={() => update(p.id, { status: "在售" })}>
                    重新上架
                  </button>
                )}
              </footer>
            </div>
          ))
      ) : (
        <Empty title={`暂无${status}商品`} text="相关商品会显示在这里" />
      )}
    </div>
  )
}
function SimpleList({
  title,
  items,
  back,
  detail,
}: {
  title: string
  items: Product[]
  back: () => void
  detail: (id: number) => void
}) {
  return (
    <div className="screen">
      <Top title={title} back={back} />
      {items.length ? (
        <div className="product-grid">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} detail={() => detail(p.id)} />
          ))}
        </div>
      ) : (
        <Empty title="这里还是空的" text="看到喜欢的商品，点爱心收藏吧" />
      )}
    </div>
  )
}
function Orders({
  p,
  appointment,
  back,
  complete,
}: {
  p: Product
  appointment?: Appointment
  back: () => void
  complete: () => void
}) {
  return (
    <div className="screen">
      <Top title="购买与预约" back={back} />
      {appointment ? (
        <div className="order-card">
          <header>
            <span>{appointment.status}</span>
            <b>预约编号 NL240622</b>
          </header>
          <div>
            <img src={p.image} />
            <p>
              <b>{p.title}</b>
              <strong>{p.price} DKK</strong>
              <span>
                {appointment.date} · {appointment.time}
              </span>
            </p>
          </div>
          <section>
            <p>标准服务费（2%）</p>
            <b>{(p.price * 0.02).toFixed(2)} DKK</b>
            <small>首件成交优惠</small>
            <small>-{(p.price * 0.02).toFixed(2)} DKK</small>
            <strong>实际服务费</strong>
            <strong>0.00 DKK</strong>
            <p>卖家应收（线下）</p>
            <b>{p.price.toFixed(2)} DKK</b>
          </section>
          {appointment.status === "已确认" && (
            <button className="primary wide" onClick={complete}>
              模拟线下交付并确认收货
            </button>
          )}
          {appointment.status === "待确认" && (
            <p className="waiting">等待卖家确认预约</p>
          )}
          {appointment.status === "已完成" && (
            <div className="done-banner">
              <Icon name="check" />
              交易已完成，商品已同步标记为售出
            </div>
          )}
        </div>
      ) : (
        <Empty title="暂无购买记录" text="预约或购买的商品会显示在这里" />
      )}
    </div>
  )
}
function Promo({
  p,
  back,
  success,
}: {
  p: Product
  back: () => void
  success: () => void
}) {
  const [plan, setPlan] = useState<number | null>(null),
    [start, setStart] = useState(localDate()),
    [end, setEnd] = useState(localDate(3)),
    [confirmed, setConfirmed] = useState(false),
    [error, setError] = useState(""),
    [submitting, setSubmitting] = useState(false)
  const submit = () => {
    if (submitting) return
    const nextError = validatePromotion(p.status, plan, start, end, confirmed)
    if (nextError) {
      setError(nextError)
      return
    }
    setSubmitting(true)
    setTimeout(success, 300)
  }
  return (
    <div className="screen">
      <Top title="推广商品" back={back} />
      <div className="booking-product">
        <img src={p.image} />
        <div>
          <b>{p.title}</b>
          <strong>{p.price} DKK</strong>
        </div>
      </div>
      <h3 className="form-title">选择推广方案</h3>
      {[
        [9, "24 小时", "分类页优先展示"],
        [19, "3 天", "首页与分类页优先展示"],
        [39, "7 天", "更长时间持续展示"],
      ].map(([v, d, t]) => (
        <button
          className={"plan " + (plan === v ? "active" : "")}
          onClick={() => {
            setPlan(v as number)
            setError("")
          }}
          key={v}
        >
          <i>{plan === v && <Icon name="check" />}</i>
          <div>
            <b>{d}</b>
            <span>{t}</span>
          </div>
          <strong>{v} DKK</strong>
        </button>
      ))}
      <div className="inline-fields promo-dates">
        <label className="field">
          开始日期 *
          <input
            type="date"
            min={localDate()}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="field">
          结束日期 *
          <input
            type="date"
            min={start}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <div className="disclaimer">
        推广可提高展示机会，但不承诺固定曝光量或成交效果。
      </div>
      <label className="check-row confirm-promo">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => {
            setConfirmed(e.target.checked)
            setError("")
          }}
        />
        我已确认推广费用、时间和效果说明
      </label>
      {error && <p className="form-error">{error}</p>}
      <button
        className="primary wide sticky-cta"
        disabled={submitting || p.status !== "在售"}
        onClick={submit}
      >
        {p.status !== "在售"
          ? "该商品当前不可推广"
          : submitting
            ? "确认中…"
            : `模拟支付 ${plan || 0} DKK 并确认`}
      </button>
    </div>
  )
}
function Support({ back }: { back: () => void }) {
  const [q, setQ] = useState<number | null>(null)
  return (
    <div className="screen">
      <Top title="帮助中心" back={back} />
      <div className="support-hero">
        <h2>你好，需要什么帮助？</h2>
        <div className="search-box">
          <Icon name="search" />
          <span>搜索常见问题</span>
        </div>
      </div>
      <SectionTitle title="常见问题" />
      {[
        "如何安全地线下交易？",
        "平台会保管我的货款吗？",
        "如何取消取货预约？",
        "2% 服务费如何计算？",
      ].map((x, i) => (
        <button
          className="faq"
          key={x}
          onClick={() => setQ(q === i ? null : i)}
        >
          <b>{x}</b>
          <Icon name="chevron" />
          {q === i && (
            <p>
              {i === 1
                ? "不会。NordicLink 原型不处理或托管资金，请在线下验货后自行完成支付。"
                : "进入对应订单或预约页面即可管理；如有争议，请保留聊天记录并联系客服。"}
            </p>
          )}
        </button>
      ))}
      <button className="contact-card">
        <div className="avatar teal">
          <Icon name="chat" />
        </div>
        <span>
          <b>联系在线客服</b>
          <p>工作日 09:00–18:00</p>
        </span>
        <Icon name="chevron" />
      </button>
    </div>
  )
}
function Reports({
  back,
  notify,
}: {
  back: () => void
  notify: (s: string) => void
}) {
  const [reason, setReason] = useState("疑似诈骗")
  return (
    <div className="screen">
      <Top title="举报与记录" back={back} />
      <div className="report-record">
        <span>处理中</span>
        <b>举报商品：异常低价自行车</b>
        <p>提交于 6 月 18 日 · 平台将在 48 小时内处理</p>
      </div>
      <h3 className="form-title">提交新举报</h3>
      <div className="form">
        <div className="field">
          举报对象
          <select>
            <option>举报商品</option>
            <option>举报用户</option>
          </select>
        </div>
        <div className="field">
          举报原因
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>疑似诈骗</option>
            <option>商品信息不实</option>
            <option>骚扰或不当言论</option>
          </select>
        </div>
        <label className="field">
          补充说明
          <textarea placeholder="请描述具体情况…" />
        </label>
        <button
          className="primary wide"
          onClick={() => notify("举报已提交，我们会尽快处理")}
        >
          提交举报
        </button>
      </div>
    </div>
  )
}
function Login({ back, login }: { back: () => void login: () => void }) {
  const [mode, setMode] = useState<"email" | "phone">("email"),
    [email, setEmail] = useState("demo@nordiclink.dk"),
    [phone, setPhone] = useState("+45 12345678"),
    [country, setCountry] = useState<"DK" | "CN">("DK"),
    [pass, setPass] = useState("demo123"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false)
  const submit = () => {
    if (loading) return
    const identityError =
      mode === "email" ? validateEmail(email) : validatePhone(phone, country)
    if (identityError) {
      setError(identityError)
      return
    }
    if (!pass) {
      setError("请输入密码。")
      return
    }
    setLoading(true)
    setTimeout(() => {
      const isDemo =
        pass === "demo123" &&
        (mode === "email"
          ? email.trim().toLowerCase() === "demo@nordiclink.dk"
          : phone.replace(/\s/g, "") === "+4512345678")
      if (isDemo) login()
      else {
        setError("登录失败：演示环境仅支持页面下方标注的演示账号。")
        setLoading(false)
      }
    }, 450)
  }
  return (
    <div className="screen login">
      <Top title="" back={back} />
      <Logo />
      <h1>欢迎回来</h1>
      <p>登录后即可收藏、聊天和发布商品</p>
      <div className="segmented">
        <button
          className={mode === "email" ? "active" : ""}
          onClick={() => {
            setMode("email")
            setError("")
          }}
        >
          邮箱登录
        </button>
        <button
          className={mode === "phone" ? "active" : ""}
          onClick={() => {
            setMode("phone")
            setError("")
          }}
        >
          手机号登录
        </button>
      </div>
      {mode === "email" ? (
        <label className={"field " + (error.includes("邮箱") ? "invalid" : "")}>
          邮箱 *
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError("")
            }}
          />
        </label>
      ) : (
        <div className={"field " + (error.includes("手机号") ? "invalid" : "")}>
          手机号 *
          <div className="phone-field">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as "DK" | "CN")}
            >
              <option value="DK">丹麦 +45</option>
              <option value="CN">中国 +86</option>
            </select>
            <input
              inputMode="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                setError("")
              }}
            />
          </div>
        </div>
      )}
      <label className="field">
        密码 *
        <input
          type="password"
          value={pass}
          onChange={(e) => {
            setPass(e.target.value)
            setError("")
          }}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary wide" disabled={loading} onClick={submit}>
        {loading ? "登录中…" : "登录演示账号"}
      </button>
      <small>
        演示模式：demo@nordiclink.dk / demo123
        <br />
        不会连接真实身份服务
      </small>
    </div>
  )
}
function Settings({
  back,
  notify,
}: {
  back: () => void
  notify: (message: string) => void
}) {
  const [notifications, setNotifications] = useState(true)
  const [location, setLocation] = useState(false)
  return (
    <div className="screen">
      <Top title="设置" back={back} />
      <section className="settings-group">
        <h3>偏好设置</h3>
        <label>
          <span>
            <b>消息通知</b>
            <small>聊天、预约和交易状态提醒</small>
          </span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
        </label>
        <label>
          <span>
            <b>位置权限</b>
            <small>关闭后仍可手动选择城区</small>
          </span>
          <input
            type="checkbox"
            checked={location}
            onChange={(e) => setLocation(e.target.checked)}
          />
        </label>
      </section>
      <section className="settings-group">
        <h3>应用设置</h3>
        <button onClick={() => notify("当前语言：简体中文")}>
          语言{" "}
          <span>
            简体中文 <Icon name="chevron" />
          </span>
        </button>
        <button onClick={() => notify("缓存已清理，交易数据已保留")}>
          清理缓存{" "}
          <span>
            <Icon name="chevron" />
          </span>
        </button>
        <button onClick={() => notify("NordicLink Prototype 1.0")}>
          关于 NordicLink{" "}
          <span>
            <Icon name="chevron" />
          </span>
        </button>
      </section>
    </div>
  )
}
function Empty({ title, text }: { title: string text: string }) {
  return (
    <div className="empty">
      <div>
        <Icon name="search" />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}
function BottomNav({ active, go }: { active: Tab go: (t: Tab) => void }) {
  const nav: [Tab, string, string][] = [
    ["home", "home", "首页"],
    ["categories", "grid", "分类"],
    ["sell", "plus", "发布"],
    ["messages", "chat", "消息"],
    ["profile", "user", "我的"],
  ]
  return (
    <nav className="bottom-nav">
      {nav.map(([t, i, l]) => (
        <button
          className={
            (active === t ? "active " : "") + (t === "sell" ? "sell" : "")
          }
          onClick={() => go(t)}
          key={t}
        >
          <span>
            <Icon name={i} />
            {t === "messages" && <i>2</i>}
          </span>
          <b>{l}</b>
        </button>
      ))}
    </nav>
  )
}
export default App
