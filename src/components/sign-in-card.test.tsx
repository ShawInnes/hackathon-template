import { render, screen } from "@testing-library/react"
import { SignInCard } from "./sign-in-card"

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe("SignInCard", () => {
  it("renders the sign-in heading", () => {
    render(<SignInCard />)
    expect(screen.getByRole("heading")).toBeInTheDocument()
  })

  it("renders the sign-in button linking to SSO", () => {
    render(<SignInCard />)
    const link = screen.getByRole("link", { name: /sign in with sso/i })
    expect(link).toHaveAttribute("href", "/api/auth/signin")
  })
})
