export default function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} ${className}`} {...props} />;
}
