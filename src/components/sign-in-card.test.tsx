import { render, screen } from "@testing-library/react"
import { SignInCard } from "./sign-in-card"

vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
}))

describe("SignInCard", () => {
  it("renders the sign-in heading", () => {
    render(<SignInCard authEnabled={true} />)
    expect(screen.getByRole("heading")).toBeInTheDocument()
  })

  it("renders the SSO label when auth is enabled", () => {
    render(<SignInCard authEnabled={true} />)
    expect(screen.getByRole("button", { name: /sign in with sso/i })).toBeInTheDocument()
  })

  it("renders the dev-mode label when auth is disabled", () => {
    render(<SignInCard authEnabled={false} />)
    expect(screen.getByRole("button", { name: /continue as dev user/i })).toBeInTheDocument()
  })
})
