import { logIn } from '@/app/actions';

export const metadata = { title: 'Sign in · Productivity Dashboard' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h1>Productivity</h1>
        <p>Enter the dashboard password to continue.</p>

        {searchParams.error ? (
          <p className="error" role="alert">
            That password was not correct.
          </p>
        ) : null}

        <form action={logIn} className="stack">
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              autoFocus
            />
          </label>
          <button className="primary" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
