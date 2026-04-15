import { render, screen } from "@testing-library/react"
import { SignInCard } from "./sign-in-card"

vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
}))

describe("SignInCard", () => {
  it("renders the sign-in heading", () => {
    render(<SignInCard />)
    expect(screen.getByRole("heading")).toBeInTheDocument()
  })

  it("renders the sign-in button", () => {
    render(<SignInCard />)
    expect(screen.getByRole("button", { name: /sign in with sso/i })).toBeInTheDocument()
  })
})
