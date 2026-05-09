import * as real from "./auth.real"
import * as mock from "./auth.mock"

const AUTH_ENABLED = process.env.AUTH_ENABLED === "true"

const impl: typeof real = AUTH_ENABLED ? real : (mock as unknown as typeof real)

export const { handlers, auth, signIn, signOut } = impl
