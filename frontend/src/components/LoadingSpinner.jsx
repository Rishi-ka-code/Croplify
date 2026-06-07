export default function LoadingSpinner({ dark = false, size = 24 }) {
  return (
    <div
      className={`spinner ${dark ? 'dark' : ''}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  )
}