import { render, screen } from "@testing-library/react"
import { Navbar } from "./navbar"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe("Navbar", () => {
  it("renders sign-in button when user is not authenticated", () => {
    render(<Navbar user={null} authEnabled={true} />)
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })

  it("renders user name when authenticated", () => {
    render(<Navbar user={{ name: "Ada Lovelace", email: "ada@example.com", image: null }} authEnabled={true} />)
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument()
  })

  it("does not show sign-in button when authenticated", () => {
    render(<Navbar user={{ name: "Ada Lovelace", email: "ada@example.com", image: null }} authEnabled={true} />)
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument()
  })
})
